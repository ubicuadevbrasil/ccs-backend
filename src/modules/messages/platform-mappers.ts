import { MessageType, MessagePlatform, MessageStatus, SenderType, RecipientType } from './entities/message.entity';

/**
 * Platform-specific message mapping interfaces
 * Each platform can implement its own mapping logic
 */

export interface PlatformMessageMapper {
  mapToPlatformMessageData(rawMessage: any, platform: MessagePlatform): PlatformMessageData;
  determineMessageType(message: any): MessageType;
  extractMediaUrl(message: any): string | undefined;
  extractMessageText(message: any): string | undefined;
}

export interface PlatformMessageData {
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
  metadata: any; // Platform-specific data
  replyMessageId?: string;
}

/**
 * WhatsApp-specific message mapper
 */
export class WhatsAppMessageMapper implements PlatformMessageMapper {
  mapToPlatformMessageData(rawMessage: any, platform: MessagePlatform): PlatformMessageData {
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
        platform: 'whatsapp',
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
}

/**
 * Instagram-specific message mapper (placeholder for future implementation)
 */
export class InstagramMessageMapper implements PlatformMessageMapper {
  mapToPlatformMessageData(rawMessage: any, platform: MessagePlatform): PlatformMessageData {
    // TODO: Implement Instagram-specific mapping
    throw new Error('Instagram message mapper not implemented yet');
  }

  determineMessageType(message: any): MessageType {
    // TODO: Implement Instagram-specific message type detection
    return MessageType.OTHER;
  }

  extractMediaUrl(message: any): string | undefined {
    // TODO: Implement Instagram-specific media URL extraction
    return undefined;
  }

  extractMessageText(message: any): string | undefined {
    // TODO: Implement Instagram-specific text extraction
    return undefined;
  }
}

/**
 * Telegram-specific message mapper (placeholder for future implementation)
 */
export class TelegramMessageMapper implements PlatformMessageMapper {
  mapToPlatformMessageData(rawMessage: any, platform: MessagePlatform): PlatformMessageData {
    // TODO: Implement Telegram-specific mapping
    throw new Error('Telegram message mapper not implemented yet');
  }

  determineMessageType(message: any): MessageType {
    // TODO: Implement Telegram-specific message type detection
    return MessageType.OTHER;
  }

  extractMediaUrl(message: any): string | undefined {
    // TODO: Implement Telegram-specific media URL extraction
    return undefined;
  }

  extractMessageText(message: any): string | undefined {
    // TODO: Implement Telegram-specific text extraction
    return undefined;
  }
}

/**
 * Message mapper factory
 */
export class MessageMapperFactory {
  static getMapper(platform: MessagePlatform): PlatformMessageMapper {
    switch (platform) {
      case MessagePlatform.WHATSAPP:
        return new WhatsAppMessageMapper();
      case MessagePlatform.INSTAGRAM:
        return new InstagramMessageMapper();
      case MessagePlatform.TELEGRAM:
        return new TelegramMessageMapper();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}
