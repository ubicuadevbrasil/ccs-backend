import { Injectable } from '@nestjs/common';
import { MessageType, MessagePlatform, MessageStatus, SenderType, RecipientType } from './entities/message.entity';
import { EvolutionMessageMapperService } from '../whatsapp/evolution/evolution-mapper';
import { OtimaMessageMapperService } from '../whatsapp/otima/otima-mapper';

/**
 * Unified platform message data interface
 */
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
 * Platform-specific message mapping interface
 * Each platform can implement its own mapping logic
 */
export interface PlatformMessageMapper {
  mapToPlatformMessageData(rawMessage: any, platform: MessagePlatform): PlatformMessageData;
  determineMessageType(message: any): MessageType;
  extractMediaUrl(message: any): string | undefined;
  extractMessageText(message: any): string | undefined;
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
 * Centralized message mapper service
 * Uses platform-specific mappers to handle different message formats
 */
@Injectable()
export class MessageMapperService {
  private readonly evolutionMapper: EvolutionMessageMapperService;
  private readonly otimaMapper: OtimaMessageMapperService;

  constructor() {
    // Create instances directly to avoid circular dependencies
    this.evolutionMapper = new EvolutionMessageMapperService();
    this.otimaMapper = new OtimaMessageMapperService();
  }

  /**
   * Get the appropriate mapper for a platform and platform type
   */
  getMapper(platform: MessagePlatform, platformType?: string): PlatformMessageMapper {
    // Check if this is an Otima platform
    if (platformType === 'otima') {
      return this.otimaMapper;
    }

    // Check if this is an Evolution platform
    if (platformType === 'evolution') {
      return this.evolutionMapper;
    }

    switch (platform) {
      case MessagePlatform.WHATSAPP:
        // Default to Evolution for WhatsApp if no specific platform type
        return this.evolutionMapper;
      case MessagePlatform.INSTAGRAM:
        return new InstagramMessageMapper();
      case MessagePlatform.TELEGRAM:
        return new TelegramMessageMapper();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Map raw message data to platform message data using the appropriate mapper
   */
  mapToPlatformMessageData(
    rawMessage: any, 
    platform: MessagePlatform, 
    platformType?: string
  ): PlatformMessageData {
    const mapper = this.getMapper(platform, platformType);
    return mapper.mapToPlatformMessageData(rawMessage, platform);
  }
}

/**
 * Message mapper factory (for backward compatibility)
 * @deprecated Use MessageMapperService instead
 */
export class MessageMapperFactory {
  private static messageMapperService: MessageMapperService;

  static setMessageMapperService(service: MessageMapperService): void {
    MessageMapperFactory.messageMapperService = service;
  }

  static getMapper(platform: MessagePlatform, platformType?: string): PlatformMessageMapper {
    if (!MessageMapperFactory.messageMapperService) {
      throw new Error('MessageMapperService not initialized. Use MessageMapperService directly instead.');
    }
    return MessageMapperFactory.messageMapperService.getMapper(platform, platformType);
  }
}
