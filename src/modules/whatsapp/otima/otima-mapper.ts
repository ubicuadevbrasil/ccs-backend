import { randomUUID } from 'crypto';
import { MessageType, MessagePlatform, MessageStatus, SenderType, RecipientType } from '../../messages/entities/message.entity';
import { OtimaWebhookMessagePayload } from './interfaces/otima.interface';

export interface OtimaMessageMapper {
  mapToPlatformMessageData(rawMessage: any, platform: MessagePlatform): OtimaMessageData;
  determineMessageType(messageType: string): MessageType;
  extractMediaUrl(payload: OtimaWebhookMessagePayload): string | undefined;
  extractMessageText(payload: OtimaWebhookMessagePayload): string | undefined;
}

export interface OtimaMessageData {
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
  metadata: any;
  replyMessageId?: string;
}

export class OtimaMessageMapperService implements OtimaMessageMapper {
  mapToPlatformMessageData(rawMessage: any, platform: MessagePlatform): OtimaMessageData {
    const payload = rawMessage.data as OtimaWebhookMessagePayload;
    const customer = rawMessage.customer;
    const sessionId = rawMessage.sessionId;
    const messageType = this.determineMessageType(payload.payload.type);
    // Otima may send session ID instead of message_id for inbound; use UUID until confirmed
    const messageId = randomUUID();
    return {
      messageId,
      sessionId,
      senderType: SenderType.CUSTOMER,
      recipientType: RecipientType.SYSTEM,
      customerId: customer.id,
      userId: null,
      fromMe: false,
      system: false,
      isGroup: customer.isGroup,
      message: this.extractMessageText(payload),
      media: this.extractMediaUrl(payload),
      type: messageType,
      platform,
      status: MessageStatus.DELIVERED,
      metadata: {
        originalWebhook: payload,
        platform: 'otima',
      },
    };
  }

  determineMessageType(messageType: string): MessageType {
    switch (messageType) {
      case 'text':
        return MessageType.TEXT;
      case 'image':
        return MessageType.IMAGE;
      case 'video':
        return MessageType.VIDEO;
      case 'audio':
      case 'ptt':
        return MessageType.AUDIO;
      case 'document':
        return MessageType.DOCUMENT;
      case 'location':
        return MessageType.LOCATION;
      case 'vcard':
        return MessageType.CONTACT;
      default:
        return MessageType.OTHER;
    }
  }

  extractMediaUrl(payload: OtimaWebhookMessagePayload): string | undefined {
    const body = payload.payload.body;
    if (typeof body === 'string') {
      return undefined;
    }
    if (body?.file) {
      return body.file;
    }
    if (body?.url) {
      return body.url;
    }
    return undefined;
  }

  extractMessageText(payload: OtimaWebhookMessagePayload): string | undefined {
    const body = payload.payload.body;
    if (typeof body === 'string') {
      return body;
    }
    if (body?.caption) {
      return body.caption;
    }
    if (body?.text) {
      return body.text;
    }
    return undefined;
  }

  /**
   * Map Otima CallbackStatus to MessageStatus enum.
   * Otima values: blacklist, cancelado, entregue, enviado, inválido, lido,
   * não entregue, não Enviado, repetido, válido, Indisponível
   */
  mapAckStatusToMessageStatus(otimaStatus: string): MessageStatus | null {
    const normalized = otimaStatus?.toLowerCase().trim();
    switch (normalized) {
      case 'enviado':
      case 'válido':
        return MessageStatus.SENT;
      case 'entregue':
        return MessageStatus.DELIVERED;
      case 'lido':
        return MessageStatus.READ;
      case 'blacklist':
      case 'cancelado':
      case 'inválido':
      case 'não entregue':
      case 'não enviado':
      case 'repetido':
      case 'indisponível':
        return MessageStatus.FAILED;
      default:
        return null;
    }
  }

  createOtimaData(sendMessageDto: any, user: any, customerData: any): {
    toNumber: string;
    text?: string;
    mediaUrl?: string;
    messageType: MessageType;
    replyMessageId?: string;
    isGroup: boolean;
  } {
    const toNumber = customerData.number || customerData.customerPhone;
    if (!toNumber) {
      throw new Error('Phone number is required for sending messages via Otima');
    }
    return {
      toNumber,
      text: sendMessageDto.message,
      mediaUrl: sendMessageDto.media,
      messageType: sendMessageDto.type || MessageType.TEXT,
      replyMessageId: sendMessageDto.replyMessageId,
      isGroup: sendMessageDto.isGroup ?? customerData.isGroup,
    };
  }
}


