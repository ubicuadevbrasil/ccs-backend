import { Injectable, Logger } from '@nestjs/common';
import { 
  InboundMessageWebhookDto, 
  StatusWebhookDto,
  SandboxInboundMessageWebhookDto,
  SandboxStatusWebhookDto 
} from '../dto/vonage.dto';
import { CustomerService } from '../../../customer/customer.service';
import { QueueService } from '../../../customer-queue/queue.service';
import { MessageStorageService } from '../../../messages/message-storage.service';
import { Customer, CustomerPlatform, CustomerStatus, CustomerType } from '../../../customer/entities/customer.entity';
import { MessagePlatform, MessageType, MessageStatus, SenderType, RecipientType } from '../../../messages/entities/message.entity';
import { CreateCustomerDto } from '../../../customer/dto/customer.dto';
import { CreateQueueWhatsAppDto } from '../../../customer-queue/dto/queue.dto';
import { MessagesService } from '../../../messages/messages.service';
import { AddReactionDto } from '../../../messages/dto/message.dto';
import { PlatformMessageData } from '../../../messages/message-mapper';
import { ChatMessagePayload, SocketService } from '../../../socket/socket.service';
import { AtosBotService } from '../../../atos-bot/atos-bot.service';
import { VonageService } from '../vonage.service';
import { QueueStatus } from '../../../customer-queue/entities/queue.entity';
import { randomUUID } from 'crypto';
import {
  HOLIDAY_DATE_RANGE,
  DEFAULT_WELCOME_MESSAGE,
  HOLIDAY_WELCOME_MESSAGE,
} from './welcome-message.constants';

/**
 * Vonage Webhook Service
 * Handles processing of webhook events from Vonage WhatsApp Business API
 * Migrated from legacy vonage.js logic
 */
@Injectable()
export class VonageWebhookService {
  private readonly logger = new Logger(VonageWebhookService.name);
  
  // Blacklist of phone numbers to ignore
  private readonly blacklist = ['5518981483339'];

  constructor(
    private readonly customerService: CustomerService,
    private readonly queueService: QueueService,
    private readonly messageStorageService: MessageStorageService,
    private readonly messagesService: MessagesService,
    private readonly socketService: SocketService,
    private readonly vonageService: VonageService,
    private readonly atosBotService: AtosBotService,
  ) {}

  /**
   * Sends message status update to the queue's assigned user when customer is in service.
   */
  private async emitStatusUpdateToAssignedUser(result: {
    sessionId: string;
    messageId: string;
    status: MessageStatus;
  }): Promise<void> {
    try {
      const queue = await this.queueService.findQueueBySessionId(result.sessionId);
      const isInService = queue.status === QueueStatus.SERVICE;
      const hasAssignedUser = queue.userId && queue.userId !== 'system';
      if (isInService && hasAssignedUser) {
        this.socketService.sendMessageStatusUpdateToUser(queue.userId, {
          messageId: result.messageId,
          status: result.status as 'sent' | 'delivered' | 'read' | 'failed',
          timestamp: new Date().toISOString(),
          chatId: result.sessionId,
        });
      }
    } catch {
      // Queue may not exist (e.g. session ended); ignore
    }
  }

  /**
   * Process inbound message webhook
   * Follows the same queue logic as Evolution message processor
   */
  async processInboundMessage(webhookData: InboundMessageWebhookDto): Promise<void> {
    try {
      this.logger.log(`Processing inbound message: ${webhookData.message_uuid}`);
      
      // Extract contact information from the webhook
      const contactUid = this.extractContactUid(webhookData);
      
      if (!contactUid) {
        this.logger.warn('No contact UID found in webhook data, skipping customer processing');
        return;
      }

      // Check blacklist
      if (this.blacklist.includes(contactUid)) {
        this.logger.log(`Contact ${contactUid} is in blacklist, ignoring message`);
        return;
      }
      
      // Skip status messages
      if (contactUid.indexOf('status') >= 0) {
        this.logger.log('Skipping status message');
        return;
      }
      
      // Handle group messages
      if (contactUid.indexOf('g.us') > -1) {
        await this.handleGroupMessage(contactUid);
        return;
      }

      // Process customer and queue management (same logic as Evolution)
      await this.processCustomerMessage(contactUid, webhookData);
      
      this.logger.log(`Successfully processed inbound message for customer: ${contactUid}`);
      
    } catch (error) {
      this.logger.error('Error processing inbound message:', error);
      throw error;
    }
  }

  /**
   * Process status webhook
   * Handles message status updates from Vonage
   */
  async processStatusUpdate(webhookData: StatusWebhookDto): Promise<void> {
    try {
      this.logger.log(`Processing status update: ${webhookData.message_uuid} - ${webhookData.status}`);
      
      // Extract message ID from webhook data
      const messageId = webhookData.message_uuid;
      
      if (!messageId) {
        this.logger.warn('No message ID found in status webhook, skipping processing');
        return;
      }

      // Handle the message status update using the message storage service (Vonage-specific handler)
      const result = await this.messageStorageService.handleVonageMessageUpdate(messageId, webhookData.status);
      if (result) {
        await this.emitStatusUpdateToAssignedUser(result);
      }
      this.logger.log(`Successfully processed status update for message: ${messageId} with status: ${webhookData.status}`);
    } catch (error) {
      this.logger.error('Error processing status update:', error);
      throw error;
    }
  }

  /**
   * Process customer message - main workflow implementation
   * Aligned with Otima: ensureQueue, store message, welcome if new queue, emit to assigned user.
   */
  private async processCustomerMessage(
    contactUid: string,
    webhookData: InboundMessageWebhookDto,
  ): Promise<void> {
    try {
      let customer = await this.customerService.findCustomerByPlatformIdWithTags(
        contactUid,
        CustomerPlatform.WHATSAPP,
      );
      if (!customer) {
        this.logger.log(`Customer not found for ${contactUid}, creating new customer`);
        customer = await this.createCustomerFromVonage(contactUid, webhookData);
      } else {
        this.logger.log(`Customer found for ${contactUid} with ${customer.tags?.length || 0} tags`);
      }
      const { queue, isNewQueue } = await this.ensureQueue(customer, contactUid);
      const inboundResult = await this.messageStorageService.storePlatformMessage(
        {
          data: webhookData,
          customer,
          platform: 'vonage',
        },
        MessagePlatform.WHATSAPP,
        queue.sessionId,
      );
      if (isNewQueue) {
        await this.sendWelcomeMessage(contactUid, queue.sessionId, customer.id);
      } else {
        await this.queueService.updateLastMessage(queue.sessionId, inboundResult.redisMessage);
      }
      this.emitMessageToAssignedUser(queue, inboundResult.postgresMessage);
      const messageText = this.extractMessageText(webhookData);
      await this.processMessageWithAtosBot(customer, queue.sessionId, messageText);
    } catch (error) {
      this.logger.error(`Error processing customer message for ${contactUid}:`, error);
      throw error;
    }
  }

  /**
   * Ensure customer has a queue; create one if not. Returns queue and whether it was just created.
   */
  private async ensureQueue(
    customer: Customer,
    contactUid: string,
  ): Promise<{ queue: { sessionId: string; status: string; userId: string }; isNewQueue: boolean }> {
    try {
      const queue = await this.queueService.findQueueByCustomerId(customer.id);
      return { queue, isNewQueue: false };
    } catch {
      const sessionId = randomUUID();
      const queueDto: CreateQueueWhatsAppDto = {
        sessionId,
        customerId: customer.id,
        customer,
        userId: 'system',
        metadata: {
          platform: 'vonage',
          contactUid,
        },
      };
      await this.queueService.createQueueWhatsApp(queueDto);
      const queue = await this.queueService.findQueueByCustomerId(customer.id);
      return { queue, isNewQueue: true };
    }
  }

  /**
   * Send welcome message for new queues (same logic as Otima).
   */
  async sendWelcomeMessage(contactUid: string, sessionId: string, customerId: string): Promise<void> {
    try {
      const now = new Date();
      const isHoliday = this.isDateInHolidayRange(now);
      const message = isHoliday ? HOLIDAY_WELCOME_MESSAGE : DEFAULT_WELCOME_MESSAGE;
      const response = await this.vonageService.sendMessage({
        toNumber: contactUid,
        type: 'text',
        txtMessage: message,
      });
      const messageId = response.message_uuid || `welcome-${randomUUID()}`;
      const platformMessageData: PlatformMessageData = {
        messageId,
        sessionId,
        senderType: SenderType.SYSTEM,
        recipientType: RecipientType.CUSTOMER,
        customerId,
        userId: null,
        fromMe: true,
        system: true,
        isGroup: false,
        message,
        type: MessageType.TEXT,
        platform: MessagePlatform.WHATSAPP,
        status: MessageStatus.SENT,
        metadata: response,
      };
      const result = await this.messageStorageService.storeMessage(platformMessageData);
      await this.queueService.updateLastMessage(sessionId, result.redisMessage);
      const queue = await this.queueService.findQueueByCustomerId(customerId);
      this.emitMessageToAssignedUser(queue, result.postgresMessage);
      this.logger.log(`Sent and stored welcome message to ${contactUid}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome message to ${contactUid}`, error as Error);
    }
  }

  private isDateInHolidayRange(date: Date): boolean {
    const time = date.getTime();
    return time >= HOLIDAY_DATE_RANGE.start.getTime() && time <= HOLIDAY_DATE_RANGE.end.getTime();
  }

  /**
   * Emit message to the queue's assigned user only when customer is in service.
   */
  private emitMessageToAssignedUser(
    queue: { status: string; userId: string },
    message: {
      id: string;
      messageId: string;
      sessionId: string;
      senderType: string;
      recipientType: string;
      customerId: string | null;
      userId: string | null;
      fromMe: boolean;
      system: boolean;
      isGroup: boolean;
      message?: string;
      media?: string;
      type: string;
      platform: string;
      status: string;
      metadata?: any;
      replyMessageId?: string;
      sentAt: Date;
      createdAt: Date;
      updatedAt: Date;
    },
  ): void {
    const isInService = queue.status === QueueStatus.SERVICE;
    const hasAssignedUser = queue.userId && queue.userId !== 'system';
    if (isInService && hasAssignedUser) {
      this.socketService.sendChatMessageToUser(queue.userId, this.toChatMessageFormat(message));
    }
  }

  private toChatMessageFormat(message: {
    id: string;
    messageId: string;
    sessionId: string;
    senderType: string;
    recipientType: string;
    customerId: string | null;
    userId: string | null;
    fromMe: boolean;
    system: boolean;
    isGroup: boolean;
    message?: string;
    media?: string;
    type: string;
    platform: string;
    status: string;
    metadata?: any;
    replyMessageId?: string;
    sentAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): ChatMessagePayload {
    return {
      id: message.id,
      messageId: message.messageId,
      sessionId: message.sessionId,
      senderType: message.senderType,
      recipientType: message.recipientType,
      customerId: message.customerId,
      userId: message.userId,
      fromMe: message.fromMe,
      system: message.system,
      isGroup: message.isGroup,
      message: message.message,
      media: message.media,
      type: message.type,
      platform: message.platform,
      status: message.status,
      metadata: message.metadata,
      replyMessageId: message.replyMessageId,
      sentAt: message.sentAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  /**
   * Create customer from Vonage webhook data
   */
  private async createCustomerFromVonage(contactUid: string, webhookData: InboundMessageWebhookDto): Promise<Customer> {
    try {
      const customerData: CreateCustomerDto = {
        platformId: contactUid,
        platform: CustomerPlatform.WHATSAPP,
        pushName: undefined,
        name: undefined,
        profilePicUrl: undefined,
        contact: contactUid.includes('@') ? contactUid.split('@')[0] : contactUid,
        priority: 0,
        isGroup: contactUid.includes('@g.us'),
        type: CustomerType.CONTACT,
        status: CustomerStatus.ACTIVE,
        tags: [],
      };
      this.logger.log(`Creating customer for ${contactUid}`);
      const customer = await this.customerService.createCustomer(customerData);
      this.logger.log(`Created new customer: ${customer.id} for ${contactUid}`);
      const customerWithTags = await this.customerService.findCustomerByIdWithTags(customer.id);
      return customerWithTags;
    } catch (error: any) {
      this.logger.error(`Error creating customer for ${contactUid}:`, error);
      if (error?.status === 409 || error?.message?.includes('already exists')) {
        this.logger.log(`Customer already exists for ${contactUid}, fetching existing customer`);
        const existingCustomer = await this.customerService.findCustomerByPlatformId(
          contactUid,
          CustomerPlatform.WHATSAPP,
        );
        if (existingCustomer) {
          return await this.customerService.findCustomerByIdWithTags(existingCustomer.id);
        }
      }
      throw error;
    }
  }

  /**
   * Process message with Atos Bot intent detection
   * This method processes incoming messages with the Atos Bot
   * Flow: User sends message -> check status -> detect intent if bot -> give proper response
   * 
   * @param customer - The customer who sent the message
   * @param sessionId - The session ID for the conversation
   * @param messageText - The message text to process
   */
  async processMessageWithAtosBot(
    customer: Customer,
    sessionId: string,
    messageText: string,
  ): Promise<void> {
    try {
      // Use the main processMessage method which handles:
      // - Checking queue status (only processes if status is BOT)
      // - Getting bot context from queue metadata
      // - Detecting intent
      // - Sending responses via VonageService and storing in MessagesService
      await this.atosBotService.processMessage(
        sessionId,
        customer.id,
        messageText,
      );
    } catch (error) {
      this.logger.error(`Error processing message with Atos Bot:`, error);
      // Don't throw - allow message to be stored even if bot processing fails
    }
  }

  /**
   * Extract message text from webhook data
   */
  private extractMessageText(webhookData: InboundMessageWebhookDto): string {
    const content = webhookData.message.content;
    
    switch (content.type) {
      case 'text':
        return content.text || '';
      case 'image':
        return content.image?.caption || '';
      case 'video':
        return content.video?.caption || '';
      case 'file':
        return content.file?.caption || '';
      case 'button':
        return content.button?.text || '';
      default:
        return '';
    }
  }

  /**
   * Extract contact UID from webhook data
   */
  private extractContactUid(webhookData: InboundMessageWebhookDto): string {
    return webhookData.from;
  }

  /**
   * Handle group messages
   */
  private async handleGroupMessage(contactUid: string): Promise<void> {
    const groupId = contactUid.substring(0, contactUid.search('-'));
    await this.onRefuseGroup(groupId);
  }

  /**
   * Handle group refusal
   */
  private async onRefuseGroup(groupId: string): Promise<void> {
    this.logger.log(`Refusing group message from group: ${groupId}`);
    // TODO: Implement group refusal logic
  }

  /**
   * Process sandbox inbound message webhook
   * Handles the different webhook structure used in sandbox/development mode
   */
  async processSandboxInboundMessage(webhookData: SandboxInboundMessageWebhookDto): Promise<void> {
    try {
      this.logger.log(`Processing sandbox inbound message: ${webhookData.message_uuid}`);
      
      // Extract contact information from the webhook
      const contactUid = webhookData.from;
      
      if (!contactUid) {
        this.logger.warn('No contact UID found in sandbox webhook data, skipping customer processing');
        return;
      }

      // Check blacklist
      if (this.blacklist.includes(contactUid)) {
        this.logger.log(`Contact ${contactUid} is in blacklist, ignoring message`);
        return;
      }
      
      // Skip status messages
      if (contactUid.indexOf('status') >= 0) {
        this.logger.log('Skipping status message');
        return;
      }
      
      // Handle group messages
      if (contactUid.indexOf('g.us') > -1) {
        await this.handleGroupMessage(contactUid);
        return;
      }

      // Process customer and queue management
      await this.processSandboxCustomerMessage(contactUid, webhookData);
      
      this.logger.log(`Successfully processed sandbox inbound message for customer: ${contactUid}`);
      
    } catch (error) {
      this.logger.error('Error processing sandbox inbound message:', error);
      throw error;
    }
  }

  /**
   * Process sandbox status webhook
   * Handles message status updates from Vonage sandbox
   */
  async processSandboxStatusUpdate(webhookData: SandboxStatusWebhookDto): Promise<void> {
    try {
      this.logger.log(`Processing sandbox status update: ${webhookData.message_uuid} - ${webhookData.status}`);
      
      // Extract message ID from webhook data
      const messageId = webhookData.message_uuid;
      
      if (!messageId) {
        this.logger.warn('No message ID found in sandbox status webhook, skipping processing');
        return;
      }

      // Handle the message status update using the message storage service (Vonage-specific handler)
      const result = await this.messageStorageService.handleVonageMessageUpdate(messageId, webhookData.status);
      if (result) {
        await this.emitStatusUpdateToAssignedUser(result);
      }
      this.logger.log(`Successfully processed sandbox status update for message: ${messageId} with status: ${webhookData.status}`);
    } catch (error) {
      this.logger.error('Error processing sandbox status update:', error);
      throw error;
    }
  }

  /**
   * Process sandbox customer message - main workflow implementation (aligned with Otima).
   */
  private async processSandboxCustomerMessage(
    contactUid: string,
    webhookData: SandboxInboundMessageWebhookDto,
  ): Promise<void> {
    try {
      let customer = await this.customerService.findCustomerByPlatformIdWithTags(
        contactUid,
        CustomerPlatform.WHATSAPP,
      );
      if (!customer) {
        this.logger.log(`Customer not found for ${contactUid}, creating new customer`);
        customer = await this.createCustomerFromSandbox(contactUid, webhookData);
      } else {
        this.logger.log(`Customer found for ${contactUid} with ${customer.tags?.length || 0} tags`);
      }
      const { queue, isNewQueue } = await this.ensureQueue(customer, contactUid);
      await this.processSandboxMessageContent(customer, webhookData, queue, isNewQueue);
    } catch (error) {
      this.logger.error(`Error processing sandbox customer message for ${contactUid}:`, error);
      throw error;
    }
  }

  /**
   * Create customer from sandbox webhook data
   */
  private async createCustomerFromSandbox(contactUid: string, webhookData: SandboxInboundMessageWebhookDto): Promise<Customer> {
    try {
      const customerData: CreateCustomerDto = {
        platformId: contactUid,
        platform: CustomerPlatform.WHATSAPP,
        pushName: undefined,
        name: undefined,
        profilePicUrl: undefined,
        contact: contactUid.includes('@') ? contactUid.split('@')[0] : contactUid,
        priority: 0,
        isGroup: contactUid.includes('@g.us'),
        type: CustomerType.CONTACT,
        status: CustomerStatus.ACTIVE,
        tags: [],
      };
      this.logger.log(`Creating customer from sandbox for ${contactUid}`);
      const customer = await this.customerService.createCustomer(customerData);
      this.logger.log(`Created new customer from sandbox: ${customer.id} for ${contactUid}`);
      const customerWithTags = await this.customerService.findCustomerByIdWithTags(customer.id);
      return customerWithTags;
    } catch (error: any) {
      this.logger.error(`Error creating customer from sandbox for ${contactUid}:`, error);
      if (error?.status === 409 || error?.message?.includes('already exists')) {
        this.logger.log(`Customer already exists for ${contactUid}, fetching existing customer`);
        const existingCustomer = await this.customerService.findCustomerByPlatformId(
          contactUid,
          CustomerPlatform.WHATSAPP,
        );
        if (existingCustomer) {
          return await this.customerService.findCustomerByIdWithTags(existingCustomer.id);
        }
      }
      throw error;
    }
  }

  /**
   * Process the actual sandbox message content (store, welcome if new queue, emit, Atos bot).
   */
  private async processSandboxMessageContent(
    customer: Customer,
    webhookData: SandboxInboundMessageWebhookDto,
    queue: { sessionId: string; status: string; userId: string },
    isNewQueue: boolean,
  ): Promise<void> {
    try {
      if (webhookData.message_type === 'reaction') {
        const originalMessageId = webhookData.context?.message_uuid;
        const action = webhookData.reaction?.action;
        const emoji = webhookData.reaction?.emoji;
        if (!originalMessageId) {
          this.logger.warn('Reaction webhook missing context.message_uuid; skipping reaction handling');
          return;
        }
        if (action === 'react' && emoji) {
          const addReactionDto: AddReactionDto = {
            messageId: originalMessageId,
            reactorId: customer.id,
            emoji,
          };
          await this.messagesService.addReaction(addReactionDto);
          await this.messageStorageService.updateMessageReactionsInRedis(queue.sessionId, originalMessageId);
          this.logger.log(`Added reaction ${emoji} from ${customer.id} to message ${originalMessageId}`);
          return;
        }
        if (action === 'unreact') {
          await this.messagesService.deleteReaction(originalMessageId, customer.id);
          await this.messageStorageService.updateMessageReactionsInRedis(queue.sessionId, originalMessageId);
          this.logger.log(`Removed reaction from ${customer.id} on message ${originalMessageId}`);
          return;
        }
        this.logger.warn(`Unknown reaction action: ${action}; skipping`);
        return;
      }
      const messageText = this.extractSandboxMessageText(webhookData);
      this.logger.log(`Processing sandbox message from customer ${customer.id}: ${messageText.substring(0, 100)}...`);
      const inboundResult = await this.messageStorageService.storePlatformMessage(
        {
          data: webhookData,
          customer,
          platform: 'vonage-sandbox',
        },
        MessagePlatform.WHATSAPP,
        queue.sessionId,
      );
      if (isNewQueue) {
        await this.sendWelcomeMessage(this.extractContactUidFromSandbox(webhookData), queue.sessionId, customer.id);
      } else {
        await this.queueService.updateLastMessage(queue.sessionId, inboundResult.redisMessage);
      }
      this.emitMessageToAssignedUser(queue, inboundResult.postgresMessage);
      this.logger.debug(`Sandbox message processed and stored for customer ${customer.displayName}: ${messageText}`);
      await this.processMessageWithAtosBot(customer, queue.sessionId, messageText);
    } catch (error) {
      this.logger.error(`Error processing sandbox message content for customer ${customer.id}:`, error);
      throw error;
    }
  }

  private extractContactUidFromSandbox(webhookData: SandboxInboundMessageWebhookDto): string {
    return webhookData.from;
  }

  /**
   * Extract message text from sandbox webhook data
   */
  private extractSandboxMessageText(webhookData: SandboxInboundMessageWebhookDto): string {
    switch (webhookData.message_type) {
      case 'text':
        return webhookData.text || '';
      case 'button':
        return webhookData.text || ''; // Button text is stored in text field for sandbox
      case 'image':
        return webhookData.image?.caption || '';
      case 'video':
        return webhookData.video?.caption || '';
      case 'file':
        return webhookData.file?.caption || '';
      case 'document':
        return webhookData.message?.body?.caption || '';
      case 'ptt':
        return webhookData.message?.body?.caption || '';
      case 'vcard':
        return webhookData.message?.body?.contact || '';
      case 'location':
        return webhookData.message?.body?.name || '';
      case 'sticker':
        return 'Sticker message';
      case 'audio':
        return 'Audio message';
      default:
        return '';
    }
  }
}
