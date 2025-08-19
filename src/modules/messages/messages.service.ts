import { Injectable, Logger } from '@nestjs/common';
import type { Knex } from 'nestjs-knex';
import { InjectKnex } from 'nestjs-knex';
import { CustomerService } from '../customer/customer.service';
import type {
  Message,
  CreateMessageDto,
  EvolutionApiMessage,
  MessageFilters,
  MessageMetrics
} from './interfaces/message.interface';
import {
  MessageType,
  MessageDirection,
  MessageStatus,
  MessageFrom
} from './interfaces/message.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectKnex() private readonly knex: Knex,
    private readonly customerService: CustomerService
  ) {}

  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    const [message] = await this.knex('messages')
      .insert({
        sessionId: createMessageDto.sessionId,
        evolutionMessageId: createMessageDto.evolutionMessageId,
        remoteJid: createMessageDto.remoteJid,
        instance: createMessageDto.instance,
        pushName: createMessageDto.pushName,
        source: createMessageDto.source,
        messageTimestamp: createMessageDto.messageTimestamp,
        messageType: createMessageDto.messageType,
        from: createMessageDto.from,
        direction: createMessageDto.direction,
        content: createMessageDto.content,
        mediaUrl: createMessageDto.mediaUrl,
        mimetype: createMessageDto.mimetype,
        caption: createMessageDto.caption,
        fileName: createMessageDto.fileName,
        fileLength: createMessageDto.fileLength,
        fileSha256: createMessageDto.fileSha256,
        width: createMessageDto.width,
        height: createMessageDto.height,
        seconds: createMessageDto.seconds,
        isAnimated: createMessageDto.isAnimated,
        ptt: createMessageDto.ptt,
        pageCount: createMessageDto.pageCount,
        latitude: createMessageDto.latitude,
        longitude: createMessageDto.longitude,
        locationName: createMessageDto.locationName,
        locationAddress: createMessageDto.locationAddress,
        contactDisplayName: createMessageDto.contactDisplayName,
        contactVcard: createMessageDto.contactVcard,
        senderId: createMessageDto.senderId,
        senderName: createMessageDto.senderName,
        senderPhone: createMessageDto.senderPhone,
        typebotMessageId: createMessageDto.typebotMessageId,
        evolutionData: createMessageDto.evolutionData || {},
        metadata: createMessageDto.metadata || {},
        status: createMessageDto.status || MessageStatus.PENDING,
        fromMe: createMessageDto.direction === MessageDirection.OUTBOUND
      })
      .returning('*');

    return message;
  }

  async processEvolutionApiMessage(evolutionMessage: EvolutionApiMessage): Promise<Message | null> {
    const { data } = evolutionMessage;
    
    // Check if message already exists
    const existingMessage = await this.findMessageByEvolutionId(data.key.id);
    if (existingMessage) {
      return existingMessage;
    }

    // Check if this is a group message
    const isGroupMessage = data.key.remoteJid.includes('@g.us');
    const customerPhone = data.key.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

    // Create or update customer with all available data
    const customer = await this.customerService.createOrUpdateFromWhatsAppData({
      remoteJid: data.key.remoteJid,
      pushName: data.pushName,
      instance: evolutionMessage.instance, // Pass instance for profile picture fetch
      // Add any other available data from the message
      ...data
    });

    let queue: any = null;
    let sessionId: string | null;

    if (isGroupMessage) {
      // For group messages, use a special sessionId and don't create/find a queue
      sessionId = null
      this.logger.log(`Processing group message with sessionId: ${sessionId}`);
    } else {
      // For non-group messages, find or create queue session
      queue = await this.knex('queues')
        .where({ customerId: customer.id })
        .whereIn('status', ['typebot', 'waiting', 'service'])
        .orderBy('createdAt', 'desc')
        .first();

      if (!queue) {
        // Create a new queue session
        sessionId = randomUUID();
        const [newQueue] = await this.knex('queues')
          .insert({
            sessionId,
            customerId: customer.id,
            status: 'typebot',
            department: 'Personal', // Default department
            evolutionInstance: evolutionMessage.instance,
            typebotData: {},
            metadata: {
              lastMessage: data,
              lastMessageTimestamp: data.messageTimestamp,
              direction: data.key.fromMe ? MessageDirection.OUTBOUND : MessageDirection.INBOUND,
            }
          })
          .returning('*');
        
        queue = newQueue;
      } else {
        sessionId = queue.sessionId;
      }
    }

    // Determine message source and sender information
    let from: MessageFrom;
    let senderId: string | undefined;
    let senderName: string | undefined;
    let senderPhone: string | undefined;

    if (data.key.fromMe) {
      // Message is from the system (operator or typebot)
      if (isGroupMessage) {
        from = MessageFrom.OPERATOR; // Group messages from system are considered operator messages
        senderId = undefined;
        senderName = 'System';
      } else if (queue && queue.status === 'typebot') {
        from = MessageFrom.TYPEBOT;
        senderId = undefined; // Typebot messages don't have a specific sender ID
        senderName = 'Typebot';
      } else {
        from = MessageFrom.OPERATOR;
        // Set senderId for operator messages
        senderId = queue?.assignedOperatorId || undefined;
        senderName = 'Operator';
      }
    } else {
      // Message is from customer - use customer ID as senderId
      from = MessageFrom.CUSTOMER;
      senderId = customer.id; // Use customer ID as senderId
      senderName = data.pushName || customerPhone;
      senderPhone = isGroupMessage ? data.key.participant?.replace('@s.whatsapp.net', '') : customerPhone;
    }

    // Extract basic message information
    const messageData = {
      evolutionMessageId: data.key.id,
      remoteJid: data.key.remoteJid,
      fromMe: data.key.fromMe,
      instance: evolutionMessage.instance,
      pushName: data.pushName,
      source: data.source,
      messageTimestamp: data.messageTimestamp,
      evolutionData: evolutionMessage,
      from,
      direction: data.key.fromMe ? MessageDirection.OUTBOUND : MessageDirection.INBOUND,
      status: MessageStatus.SENT,
      senderId,
      senderName,
      senderPhone,
      metadata: {
        isGroupMessage: isGroupMessage,
        groupJid: isGroupMessage ? data.key.remoteJid : undefined,
        ...(isGroupMessage && { groupSessionId: sessionId })
      }
    };

    // Extract message content using the reusable function
    const contentData = this.extractMessageContent(data);

    // Create the message with proper sessionId
    const [message] = await this.knex('messages')
      .insert({
        ...messageData,
        ...contentData,
        sessionId: sessionId // Use the determined sessionId (either queue.sessionId or group sessionId)
      })
      .returning('*');

    return message;
  }

  async processSendMessageEvent(evolutionMessage: EvolutionApiMessage, queueId?: string): Promise<Message | null> {
    const { data } = evolutionMessage;
    
    // Get queue information to determine message source (if queueId is provided)
    let queue: any = null;
    if (queueId) {
      queue = await this.knex('queues').where({ id: queueId }).first();
      if (!queue) {
        this.logger.warn(`Queue not found for queueId: ${queueId}`);
      }
    }
    
    // Determine message source and sender information
    let from: MessageFrom;
    let senderId: string | undefined;
    let senderName: string | undefined;
    let sessionId: string | null = null;

    if (queue && queue.status === 'typebot') {
      from = MessageFrom.TYPEBOT;
      senderId = undefined; // Typebot messages don't have a specific sender ID
      senderName = 'Typebot';
      sessionId = queue.sessionId;
    } else if (queue) {
      from = MessageFrom.OPERATOR;
      // Set senderId for operator messages
      senderId = queue.assignedOperatorId || undefined;
      senderName = 'Operator';
      sessionId = queue.sessionId;
    } else {
      // No queue found - this could be a group message or standalone message
      from = MessageFrom.OPERATOR;
      senderId = undefined;
      senderName = 'System';
      sessionId = null; // No session for messages without queue context
    }
  
    if(sessionId) {
      await this.knex('queues').where({ id: queueId }).update({ metadata: {
        ...queue.metadata,
        lastMessage: data,
        lastMessageTimestamp: data.messageTimestamp,
        direction: data.key.fromMe ? MessageDirection.OUTBOUND : MessageDirection.INBOUND,
      } });
    }

    // Extract basic message information for send.message events
    const messageData = {
      evolutionMessageId: data.key.id,
      remoteJid: data.key.remoteJid,
      fromMe: true, // send.message events are always from the system
      instance: evolutionMessage.instance,
      pushName: data.pushName,
      source: data.source,
      messageTimestamp: data.messageTimestamp,
      evolutionData: evolutionMessage,
      from,
      direction: MessageDirection.OUTBOUND, // Always outbound for send.message
      status: MessageStatus.SENT,
      sessionId: sessionId, // Use the determined sessionId (could be null for group messages)
      senderId,
      senderName
    };

    // Extract message content using the reusable function
    const contentData = this.extractMessageContent(data);

    // Check if message already exists
    const existingMessage = await this.findMessageByEvolutionId(data.key.id);
    if (existingMessage) {
      return existingMessage;
    }

    // Create the message
    const [message] = await this.knex('messages')
      .insert({
        ...messageData,
        ...contentData
      })
      .returning('*');

    return message;
  }
  
  async findMessageById(id: string): Promise<Message | null> {
    const [message] = await this.knex('messages')
      .where({ id })
      .select('*');

    return message || null;
  }

  async findMessageByEvolutionId(evolutionMessageId: string): Promise<Message | null> {
    const [message] = await this.knex('messages')
      .where({ evolutionMessageId })
      .select('*');

    return message || null;
  }

  async findMessagesBySessionId(sessionId: string): Promise<Message[]> {
    return this.knex('messages')
      .where({ sessionId })
      .orderBy('sentAt', 'asc')
      .select('*');
  }

  async findMessages(filters: MessageFilters = {}): Promise<Message[]> {
    let query = this.knex('messages').select('*');

    if (filters.sessionId) {
      query = query.where({ sessionId: filters.sessionId });
    }

    if (filters.messageType) {
      query = query.where({ messageType: filters.messageType });
    }

    if (filters.from) {
      query = query.where({ from: filters.from });
    }

    if (filters.direction) {
      query = query.where({ direction: filters.direction });
    }

    if (filters.senderId) {
      query = query.where({ senderId: filters.senderId });
    }

    if (filters.remoteJid) {
      query = query.where({ remoteJid: filters.remoteJid });
    }

    if (filters.fromMe !== undefined) {
      query = query.where({ fromMe: filters.fromMe });
    }

    if (filters.startDate) {
      query = query.where('sentAt', '>=', filters.startDate);
    }

    if (filters.endDate) {
      query = query.where('sentAt', '<=', filters.endDate);
    }

    return query.orderBy('sentAt', 'asc');
  }

  async updateMessageStatus(id: string, status: MessageStatus): Promise<Message | null> {
    const updateData: any = { status };

    if (status === MessageStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    } else if (status === MessageStatus.READ) {
      updateData.readAt = new Date();
    }

    const [message] = await this.knex('messages')
      .where({ id })
      .update(updateData)
      .returning('*');

    return message || null;
  }

  async updateMessageStatusByEvolutionId(evolutionMessageId: string, status: MessageStatus): Promise<Message | null> {
    const updateData: any = { status };

    if (status === MessageStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    } else if (status === MessageStatus.READ) {
      updateData.readAt = new Date();
    }

    const [message] = await this.knex('messages')
      .where({ evolutionMessageId })
      .update(updateData)
      .returning('*');

    return message || null;
  }

  async getMessageMetrics(startDate?: Date, endDate?: Date): Promise<MessageMetrics> {
    let query = this.knex('messages');

    if (startDate) {
      query = query.where('sentAt', '>=', startDate);
    }

    if (endDate) {
      query = query.where('sentAt', '<=', endDate);
    }

    const [metrics] = await query
      .select(
        this.knex.raw('COUNT(*) as total_messages'),
        this.knex.raw('COUNT(CASE WHEN direction = ? THEN 1 END) as inbound_messages', [MessageDirection.INBOUND]),
        this.knex.raw('COUNT(CASE WHEN direction = ? THEN 1 END) as outbound_messages', [MessageDirection.OUTBOUND]),
        this.knex.raw('COUNT(CASE WHEN messageType IN (?, ?, ?, ?, ?) THEN 1 END) as media_messages', [
          MessageType.IMAGE_MESSAGE,
          MessageType.VIDEO_MESSAGE,
          MessageType.AUDIO_MESSAGE,
          MessageType.DOCUMENT_MESSAGE,
          MessageType.STICKER_MESSAGE
        ])
      );

    return {
      totalMessages: parseInt(metrics.total_messages) || 0,
      inboundMessages: parseInt(metrics.inbound_messages) || 0,
      outboundMessages: parseInt(metrics.outbound_messages) || 0,
      mediaMessages: parseInt(metrics.media_messages) || 0,
      averageResponseTime: 0 // TODO: Implement response time calculation
    };
  }

  async deleteMessage(id: string): Promise<boolean> {
    const deletedCount = await this.knex('messages')
      .where({ id })
      .del();

    return deletedCount > 0;
  }

  async deleteMessagesBySessionId(sessionId: string): Promise<boolean> {
    const deletedCount = await this.knex('messages')
      .where({ sessionId })
      .del();

    return deletedCount > 0;
  }

  private extractMessageContent(data: any): {
    messageType: MessageType;
    content?: string;
    mediaUrl?: string;
    mimetype?: string;
    caption?: string;
    fileName?: string;
    fileLength?: string;
    fileSha256?: string;
    width?: number;
    height?: number;
    seconds?: number;
    isAnimated?: boolean;
    ptt?: boolean;
    pageCount?: number;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    locationAddress?: string;
    contactDisplayName?: string;
    contactVcard?: string;
    reactionText?: string;
    reactionToMessageId?: string;
  } {
    const messageType = data.messageType as MessageType;
    let content: string | undefined;
    let mediaUrl: string | undefined;
    let mimetype: string | undefined;
    let caption: string | undefined;
    let fileName: string | undefined;
    let fileLength: string | undefined;
    let fileSha256: string | undefined;
    let width: number | undefined;
    let height: number | undefined;
    let seconds: number | undefined;
    let isAnimated: boolean | undefined;
    let ptt: boolean | undefined;
    let pageCount: number | undefined;
    let latitude: number | undefined;
    let longitude: number | undefined;
    let locationName: string | undefined;
    let locationAddress: string | undefined;
    let contactDisplayName: string | undefined;
    let contactVcard: string | undefined;
    let reactionText: string | undefined;
    let reactionToMessageId: string | undefined;

    // Always use mediaUrl from the webhook data if available
    if (data.message.mediaUrl) {
      mediaUrl = data.message.mediaUrl;
    }

    // Extract content based on message type
    switch (messageType) {
      case MessageType.CONVERSATION:
        content = data.message.conversation;
        break;

      case MessageType.IMAGE_MESSAGE:
        const imageMsg = data.message.imageMessage;
        content = imageMsg.caption;
        if (!mediaUrl) mediaUrl = imageMsg.url;
        mimetype = imageMsg.mimetype;
        caption = imageMsg.caption;
        fileLength = imageMsg.fileLength;
        fileSha256 = imageMsg.fileSha256;
        width = imageMsg.width;
        height = imageMsg.height;
        break;

      case MessageType.VIDEO_MESSAGE:
        const videoMsg = data.message.videoMessage;
        content = videoMsg.caption;
        if (!mediaUrl) mediaUrl = videoMsg.url;
        mimetype = videoMsg.mimetype;
        caption = videoMsg.caption;
        fileLength = videoMsg.fileLength;
        seconds = videoMsg.seconds;
        break;

      case MessageType.AUDIO_MESSAGE:
        const audioMsg = data.message.audioMessage;
        if (!mediaUrl) mediaUrl = audioMsg.url;
        mimetype = audioMsg.mimetype;
        fileLength = audioMsg.fileLength;
        seconds = audioMsg.seconds;
        ptt = audioMsg.ptt;
        break;

      case MessageType.DOCUMENT_MESSAGE:
        const docMsg = data.message.documentMessage;
        content = docMsg.title;
        if (!mediaUrl) mediaUrl = docMsg.url;
        mimetype = docMsg.mimetype;
        fileName = docMsg.fileName;
        fileLength = docMsg.fileLength;
        pageCount = docMsg.pageCount;
        break;

      case MessageType.STICKER_MESSAGE:
        const stickerMsg = data.message.stickerMessage;
        if (!mediaUrl) mediaUrl = stickerMsg.url;
        mimetype = stickerMsg.mimetype;
        fileLength = stickerMsg.fileLength;
        fileSha256 = stickerMsg.fileSha256;
        width = stickerMsg.width;
        height = stickerMsg.height;
        isAnimated = stickerMsg.isAnimated;
        break;

      case MessageType.CONTACT_MESSAGE:
        const contactMsg = data.message.contactMessage;
        content = contactMsg.displayName;
        contactDisplayName = contactMsg.displayName;
        contactVcard = contactMsg.vcard;
        break;

      case MessageType.LOCATION_MESSAGE:
        const locationMsg = data.message.locationMessage;
        latitude = locationMsg.degreesLatitude;
        longitude = locationMsg.degreesLongitude;
        locationName = locationMsg.name;
        locationAddress = locationMsg.address;
        break;

      case MessageType.REACTION_MESSAGE:
        const reactionMsg = data.message.reactionMessage;
        reactionText = reactionMsg.text;
        reactionToMessageId = reactionMsg.key.id;
        break;
    }

    return {
      messageType,
      content,
      mediaUrl,
      mimetype,
      caption,
      fileName,
      fileLength,
      fileSha256,
      width,
      height,
      seconds,
      isAnimated,
      ptt,
      pageCount,
      latitude,
      longitude,
      locationName,
      locationAddress,
      contactDisplayName,
      contactVcard,
      reactionText,
      reactionToMessageId,
    };
  }
} 