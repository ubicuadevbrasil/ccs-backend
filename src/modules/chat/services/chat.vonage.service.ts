import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { VonageService } from '../../whatsapp/vonage/vonage.service';
import { MessageType } from '../../messages/entities/message.entity';
import { SendMessageDto } from '../../whatsapp/vonage/dto/vonage.dto';
import { VonageSendMessageResponse } from '../../whatsapp/vonage/interfaces/vonage.interface';

export interface VonageSendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  vonageResponse?: VonageSendMessageResponse;
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

  constructor(private readonly vonageService: VonageService) {}

  async sendMessage(vonageData: VonageMessageData): Promise<VonageSendMessageResult> {
    try {
      this.logger.log(
        `Sending ${vonageData.messageType} message via Vonage API to ${vonageData.toNumber}`,
      );
      this.validateVonageData(vonageData);
      const dto = this.convertToSendMessageDto(vonageData);
      const response = await this.vonageService.sendMessage(dto);
      return {
        success: true,
        messageId: response.message_uuid,
        vonageResponse: response,
      };
    } catch (error) {
      this.logger.error('Error sending message via Vonage API:', error as Error);
      return {
        success: false,
        error: (error as Error).message ?? 'Failed to send message via Vonage API',
      };
    }
  }

  private convertToSendMessageDto(vonageData: VonageMessageData): SendMessageDto {
    const type = this.mapMessageTypeToVonageType(vonageData.messageType);
    const dto: SendMessageDto = {
      toNumber: vonageData.toNumber,
      type,
    };
    if (type === 'text') {
      dto.txtMessage = vonageData.text;
    } else {
      dto.mediaUrl = vonageData.mediaUrl;
      dto.mediaCaption = vonageData.text;
    }
    if (vonageData.replyMessageId) {
      dto.contextMessageUuid = vonageData.replyMessageId;
    }
    return dto;
  }

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
      default:
        return 'text';
    }
  }

  private validateVonageData(vonageData: VonageMessageData): void {
    if (!vonageData.toNumber) {
      throw new BadRequestException('Phone number is required');
    }
    if (!vonageData.text && !vonageData.mediaUrl) {
      throw new BadRequestException('Either text or media URL is required');
    }
  }
}
