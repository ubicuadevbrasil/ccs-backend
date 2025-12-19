import { MessageType, MessagePlatform, MessageStatus, SenderType, RecipientType } from '../../messages/entities/message.entity';
import { EvolutionMessageData as ChatEvolutionMessageData } from '../../chat/services/chat.evolution.service';

/**
 * Evolution-specific message mapping interface
 */
export interface EvolutionMessageMapper {
  mapToPlatformMessageData(rawMessage: any, platform: MessagePlatform): EvolutionMessageData;
  determineMessageType(message: any): MessageType;
  extractMediaUrl(message: any): string | undefined;
  extractMessageText(message: any): string | undefined;
}

export interface EvolutionMessageData {
  messageId: string;
  sessionId: string;
  senderType: SenderType;
  recipientType: RecipientType;
  customerId: string | null;
  userId: string | null;
  fromMe: boolean;
  system: boolean;
  isGroup: boolean;
  message?: string;
  media?: string;
  type: MessageType;
  platform: MessagePlatform;
  status: MessageStatus;
  metadata: any; // Evolution-specific data
  replyMessageId?: string;
}

/**
 * Evolution-specific message mapper
 * Handles Evolution API message data structures
 */
export class EvolutionMessageMapperService implements EvolutionMessageMapper {
  mapToPlatformMessageData(rawMessage: any, platform: MessagePlatform): EvolutionMessageData {
    const messageData = rawMessage.data;
    const customer = rawMessage.customer;
    const event = rawMessage.event;

    return {
      messageId: messageData.key.id,
      sessionId: rawMessage.sessionId,
      senderType: SenderType.CUSTOMER,
      recipientType: RecipientType.SYSTEM, // System handles incoming messages
      customerId: customer.id,
      userId: null, // No user assigned yet
      fromMe: messageData.key.fromMe || false,
      system: false,
      isGroup: customer.isGroup,
      message: this.extractMessageText(messageData.message),
      media: this.extractMediaUrl(messageData.message),
      type: this.determineMessageType(messageData.message),
      platform: MessagePlatform.WHATSAPP,
      status: MessageStatus.DELIVERED,
      metadata: {
        originalEvent: {
          instance: event.instance,
          event: event.event,
          data: messageData,
        },
        remoteJid: messageData.key.remoteJid,
        participant: messageData.key.participant,
        messageTimestamp: messageData.messageTimestamp,
        platform: 'evolution',
        evolutionApi: true,
      },
    };
  }

  determineMessageType(message: any): MessageType {
    if (message?.conversation) {
      return MessageType.TEXT;
    } else if (message?.imageMessage) {
      return MessageType.IMAGE;
    } else if (message?.videoMessage) {
      return MessageType.VIDEO;
    } else if (message?.audioMessage) {
      return MessageType.AUDIO;
    } else if (message?.documentMessage) {
      return MessageType.DOCUMENT;
    } else if (message?.locationMessage) {
      return MessageType.LOCATION;
    } else if (message?.contactMessage) {
      return MessageType.CONTACT;
    } else if (message?.stickerMessage) {
      return MessageType.STICKER;
    } else {
      return MessageType.OTHER;
    }
  }

  extractMediaUrl(message: any): string | undefined {
    if (message?.mediaUrl) {
      return message.mediaUrl;
    } else if (message?.imageMessage?.url) {
      return message.imageMessage.url;
    } else if (message?.videoMessage?.url) {
      return message.videoMessage.url;
    } else if (message?.audioMessage?.url) {
      return message.audioMessage.url;
    } else if (message?.documentMessage?.url) {
      return message.documentMessage.url;
    } else if (message?.stickerMessage?.url) {
      return message.stickerMessage.url;
    }
    return undefined;
  }

  extractMessageText(message: any): string | undefined {
    return message?.conversation || undefined;
  }

  /**
   * Create Evolution API specific data for sending messages
   */
  createEvolutionData(sendMessageDto: any, user: any, customerData: any): ChatEvolutionMessageData {
    // Extract instance and number from customer data
    const instance = customerData.instance || 'default';
    const number = customerData.number || customerData.customerPhone;

    // Validate that we have a phone number
    if (!number) {
      throw new Error('Phone number is required for sending messages via Evolution');
    }

    return {
      instance,
      number,
      text: sendMessageDto.message,
      mediaUrl: sendMessageDto.media,
      mediaType: sendMessageDto.media ? this.getMediaTypeFromUrl(sendMessageDto.media) : undefined,
      messageType: sendMessageDto.type || MessageType.TEXT,
      replyMessageId: sendMessageDto.replyMessageId,
      isGroup: sendMessageDto.isGroup ?? customerData.isGroup,
    };
  }

  /**
   * Get media type from URL
   */
  private getMediaTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'video';
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'm4a':
        return 'audio';
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
      case 'xlsx':
      case 'pptx':
        return 'document';
      default:
        return 'document';
    }
  }
}
