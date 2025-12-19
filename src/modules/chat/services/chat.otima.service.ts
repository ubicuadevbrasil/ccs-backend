import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OtimaService } from '../../whatsapp/otima/otima.service';
import { MessageType } from '../../messages/entities/message.entity';
import { OtimaSendMessageDto, OtimaWhatsAppMessageType } from '../../whatsapp/otima/dto/otima.dto';

export interface OtimaSendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  otimaResponse?: any;
}

export interface OtimaMessageData {
  toNumber: string;
  text?: string;
  mediaUrl?: string;
  messageType: MessageType;
  replyMessageId?: string;
  isGroup: boolean;
}

@Injectable()
export class ChatOtimaService {
  private readonly logger = new Logger(ChatOtimaService.name);

  constructor(private readonly otimaService: OtimaService) {}

  async sendMessage(otimaData: OtimaMessageData): Promise<OtimaSendMessageResult> {
    try {
      this.logger.log(
        `Sending ${otimaData.messageType} message via Otima API to ${otimaData.toNumber}`,
      );
      this.validateOtimaData(otimaData);
      const dto = this.convertToSendMessageDto(otimaData);
      const response = await this.otimaService.sendMessage(dto);
      return {
        success: true,
        messageId: response.messageId,
        otimaResponse: response,
      };
    } catch (error) {
      this.logger.error('Error sending message via Otima API:', error as Error);
      return {
        success: false,
        error: (error as Error).message ?? 'Failed to send message via Otima API',
      };
    }
  }

  private convertToSendMessageDto(otimaData: OtimaMessageData): OtimaSendMessageDto {
    const type = this.mapMessageTypeToOtimaType(otimaData.messageType);
    const dto: OtimaSendMessageDto = {
      to: otimaData.toNumber,
      type,
    };
    if (type === 'text') {
      dto.text = otimaData.text;
    } else {
      dto.mediaUrl = otimaData.mediaUrl;
      dto.caption = otimaData.text;
    }
    return dto;
  }

  private mapMessageTypeToOtimaType(messageType: MessageType): OtimaWhatsAppMessageType {
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
        return 'document';
      default:
        return 'text';
    }
  }

  private validateOtimaData(otimaData: OtimaMessageData): void {
    if (!otimaData.toNumber) {
      throw new BadRequestException('Phone number is required');
    }
    if (!otimaData.text && !otimaData.mediaUrl) {
      throw new BadRequestException('Either text or media URL is required');
    }
  }
}


