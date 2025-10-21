import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { VonageService } from '../../whatsapp/vonage/vonage.service';
import { 
  MessageType, 
  MessagePlatform, 
  MessageStatus, 
  SenderType, 
  RecipientType 
} from '../../messages/entities/message.entity';
import { SendMessageDto } from '../../whatsapp/vonage/dto/vonage.dto';

export interface VonageSendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  vonageResponse?: any;
}

export interface VonageMessageData {
  toNumber: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  messageType: MessageType;
  replyMessageId?: string;
  isGroup: boolean;
}

@Injectable()
export class ChatVonageService {
  private readonly logger = new Logger(ChatVonageService.name);

  constructor(
    private readonly vonageService: VonageService,
  ) {}

  /**
   * Send a message via Vonage API
   */
  async sendMessage(vonageData: VonageMessageData): Promise<VonageSendMessageResult> {
    try {
      this.logger.log(`Sending ${vonageData.messageType} message via Vonage API to ${vonageData.toNumber}`);

      // Validate required fields
      this.validateVonageData(vonageData);

      // Convert to Vonage DTO format
      const sendMessageDto = this.convertToSendMessageDto(vonageData);

      // Send message via Vonage service
      const vonageResponse = await this.vonageService.sendMessage(sendMessageDto);

      // Extract message ID from Vonage response
      const messageId = this.extractMessageId(vonageResponse);

      this.logger.log(`Message sent successfully via Vonage API. Message ID: ${messageId}`);

      return {
        success: true,
        messageId,
        vonageResponse,
      };
    } catch (error) {
      this.logger.error(`Error sending message via Vonage API:`, error);
      return {
        success: false,
        error: error.message || 'Failed to send message via Vonage API',
      };
    }
  }

  /**
   * Convert VonageMessageData to SendMessageDto
   */
  private convertToSendMessageDto(vonageData: VonageMessageData): SendMessageDto {
    const dto: SendMessageDto = {
      toNumber: vonageData.toNumber,
      type: this.mapMessageTypeToVonageType(vonageData.messageType),
      contextMessageUuid: vonageData.replyMessageId,
    };

    // Set content based on message type
    switch (vonageData.messageType) {
      case MessageType.TEXT:
        dto.txtMessage = vonageData.text;
        break;
      case MessageType.IMAGE:
        dto.mediaUrl = vonageData.mediaUrl;
        dto.mediaCaption = vonageData.text;
        break;
      case MessageType.VIDEO:
        dto.mediaUrl = vonageData.mediaUrl;
        dto.mediaCaption = vonageData.text;
        break;
      case MessageType.AUDIO:
        dto.mediaUrl = vonageData.mediaUrl;
        break;
      case MessageType.DOCUMENT:
        dto.mediaUrl = vonageData.mediaUrl;
        dto.mediaCaption = vonageData.text;
        break;
      case MessageType.OTHER:
        // Handle button messages as OTHER type
        dto.txtMessage = vonageData.text;
        break;
    }

    return dto;
  }

  /**
   * Map MessageType to Vonage message type
   */
  private mapMessageTypeToVonageType(messageType: MessageType): string {
    switch (messageType) {
      case MessageType.TEXT:
        return 'text';
      case MessageType.IMAGE:
        return 'image';
      case MessageType.VIDEO:
        return 'video';
      case MessageType.AUDIO:
        return 'audio';
      case MessageType.DOCUMENT:
        return 'file';
      case MessageType.OTHER:
        return 'button'; // Handle button messages as OTHER type
      default:
        return 'text';
    }
  }

  /**
   * Validate Vonage API data
   */
  private validateVonageData(vonageData: VonageMessageData): void {
    if (!vonageData.toNumber) {
      throw new BadRequestException('Phone number is required');
    }

    if (!vonageData.text && !vonageData.mediaUrl) {
      throw new BadRequestException('Either text or media URL is required');
    }

    if (vonageData.messageType === MessageType.IMAGE && !vonageData.mediaUrl) {
      throw new BadRequestException('Media URL is required for image messages');
    }

    if (vonageData.messageType === MessageType.VIDEO && !vonageData.mediaUrl) {
      throw new BadRequestException('Media URL is required for video messages');
    }

    if (vonageData.messageType === MessageType.AUDIO && !vonageData.mediaUrl) {
      throw new BadRequestException('Media URL is required for audio messages');
    }

    if (vonageData.messageType === MessageType.DOCUMENT && !vonageData.mediaUrl) {
      throw new BadRequestException('Media URL is required for document messages');
    }
  }

  /**
   * Extract message ID from Vonage API response
   */
  private extractMessageId(vonageResponse: any): string {
    // Vonage API typically returns the message UUID in the response
    if (vonageResponse?.message_uuid) {
      return vonageResponse.message_uuid;
    }

    if (vonageResponse?.messageId) {
      return vonageResponse.messageId;
    }

    if (vonageResponse?.id) {
      return vonageResponse.id;
    }

    // If no message ID is found, generate one
    return `vonage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get Vonage configuration
   */
  async getConfig(): Promise<any> {
    try {
      return this.vonageService.getConfig();
    } catch (error) {
      this.logger.error(`Error getting Vonage configuration:`, error);
      throw error;
    }
  }
}
