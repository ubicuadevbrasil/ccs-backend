import { MessageType, MessagePlatform, MessageStatus, SenderType, RecipientType } from '../../messages/entities/message.entity';

/**
 * Data shape for sending messages via Vonage (used by createVonageData).
 * Defined locally to avoid dependency on chat.vonage.service.
 */
export interface VonageMessageDataForSend {
  toNumber: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  messageType: MessageType;
  replyMessageId?: string;
  isGroup: boolean;
}

/**
 * Vonage-specific message mapping interface
 */
export interface VonageMessageMapper {
  mapToPlatformMessageData(rawMessage: any, platform: MessagePlatform): VonageMessageData;
  determineMessageType(message: any): MessageType;
  extractMediaUrl(message: any): string | undefined;
  extractMessageText(message: any): string | undefined;
}

export interface VonageMessageData {
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
  metadata: any; // Vonage-specific data
  replyMessageId?: string;
}

/**
 * Vonage-specific message mapper
 * Handles both production and sandbox Vonage webhook data structures
 */
export class VonageMessageMapperService implements VonageMessageMapper {
  mapToPlatformMessageData(rawMessage: any, platform: MessagePlatform): VonageMessageData {
    const webhookData = rawMessage.data;
    const customer = rawMessage.customer;
    const isProduction = process.env.NODE_ENV === 'production';

    // Handle different webhook structures for production vs sandbox
    if (isProduction) {
      return this.mapProductionWebhook(webhookData, customer, rawMessage.sessionId);
    } else {
      return this.mapSandboxWebhook(webhookData, customer, rawMessage.sessionId);
    }
  }

  private mapProductionWebhook(webhookData: any, customer: any, sessionId: string): VonageMessageData {
    return {
      messageId: webhookData.message_uuid,
      sessionId,
      senderType: SenderType.CUSTOMER,
      recipientType: RecipientType.SYSTEM,
      customerId: customer.id,
      userId: null,
      fromMe: false,
      system: false,
      isGroup: customer.isGroup,
      message: this.extractMessageText(webhookData.message),
      media: this.extractMediaUrl(webhookData.message),
      type: this.determineMessageType(webhookData.message),
      platform: MessagePlatform.WHATSAPP,
      status: MessageStatus.DELIVERED,
      metadata: {
        originalWebhook: webhookData,
        platform: 'vonage-production',
      },
    };
  }

  private mapSandboxWebhook(webhookData: any, customer: any, sessionId: string): VonageMessageData {
    const metadata: any = {
      originalWebhook: webhookData,
      platform: 'vonage-sandbox',
    };

    // Add reaction-specific metadata
    if (webhookData.message_type === 'reaction') {
      metadata.reaction = {
        emoji: webhookData.reaction?.emoji,
        action: webhookData.reaction?.action,
        originalMessageId: webhookData.context?.message_uuid,
      };
    }

    return {
      messageId: webhookData.message_uuid,
      sessionId,
      senderType: SenderType.CUSTOMER,
      recipientType: RecipientType.SYSTEM,
      customerId: customer.id,
      userId: null,
      fromMe: false,
      system: false,
      isGroup: customer.isGroup,
      message: this.extractSandboxMessageText(webhookData),
      media: this.extractSandboxMediaUrl(webhookData),
      type: this.determineSandboxMessageType(webhookData),
      platform: MessagePlatform.WHATSAPP,
      status: MessageStatus.DELIVERED,
      metadata,
    };
  }

  determineMessageType(message: any): MessageType {
    if (!message?.content) {
      return MessageType.OTHER;
    }

    const contentType = message.content.type;
    switch (contentType) {
      case 'text':
        return MessageType.TEXT;
      case 'image':
        return MessageType.IMAGE;
      case 'video':
        return MessageType.VIDEO;
      case 'audio':
        return MessageType.AUDIO;
      case 'file':
        return MessageType.DOCUMENT;
      case 'button':
        return MessageType.TEXT; // Button responses are treated as text
      default:
        return MessageType.OTHER;
    }
  }

  determineSandboxMessageType(webhookData: any): MessageType {
    const messageType = webhookData.message_type;
    switch (messageType) {
      case 'text':
      case 'button':
        return MessageType.TEXT;
      case 'image':
        return MessageType.IMAGE;
      case 'video':
        return MessageType.VIDEO;
      case 'audio':
        return MessageType.AUDIO;
      case 'ptt':
        return MessageType.AUDIO;
      case 'document':
      case 'file':
        return MessageType.DOCUMENT;
      case 'sticker':
        return MessageType.STICKER;
      case 'location':
        return MessageType.LOCATION;
      case 'vcard':
        return MessageType.CONTACT;
      case 'reaction':
        return MessageType.TEXT; // Reactions are treated as text messages with emoji
      default:
        return MessageType.OTHER;
    }
  }

  extractMediaUrl(message: any): string | undefined {
    if (!message?.content) {
      return undefined;
    }

    const contentType = message.content.type;
    switch (contentType) {
      case 'image':
        return message.content.image?.url;
      case 'video':
        return message.content.video?.url;
      case 'audio':
        return message.content.audio?.url;
      case 'file':
        return message.content.file?.url;
      default:
        return undefined;
    }
  }

  extractSandboxMediaUrl(webhookData: any): string | undefined {
    const messageType = webhookData.message_type;
    switch (messageType) {
      case 'image':
        return webhookData.image?.url;
      case 'video':
        return webhookData.video?.url;
      case 'audio':
        return webhookData.audio?.url;
      case 'sticker':
        return webhookData.sticker?.url;
      case 'document':
        return webhookData.document?.url;
      case 'file':
        return webhookData.file?.url;
      case 'ptt':
        return webhookData.message?.body?.url;
      default:
        return undefined;
    }
  }

  extractMessageText(message: any): string | undefined {
    if (!message?.content) {
      return undefined;
    }

    const contentType = message.content.type;
    switch (contentType) {
      case 'text':
        return message.content.text;
      case 'image':
        return message.content.image?.caption;
      case 'video':
        return message.content.video?.caption;
      case 'file':
        return message.content.file?.caption;
      case 'button':
        return message.content.button?.text;
      default:
        return undefined;
    }
  }

  extractSandboxMessageText(webhookData: any): string | undefined {
    const messageType = webhookData.message_type;
    switch (messageType) {
      case 'text':
      case 'button':
        return webhookData.text;
      case 'image':
        return webhookData.image?.caption;
      case 'video':
        return webhookData.video?.caption;
      case 'file':
        return webhookData.file?.caption;
      case 'document':
        return webhookData.message?.body?.caption;
      case 'ptt':
        return webhookData.message?.body?.caption;
      case 'vcard':
        return webhookData.message?.body?.contact;
      case 'location':
        return webhookData.message?.body?.name;
      case 'sticker':
        return 'Sticker message';
      case 'audio':
        return 'Audio message';
      case 'reaction':
        return webhookData.reaction?.emoji; // Extract the emoji from reaction
      default:
        return undefined;
    }
  }

  /**
   * Map Vonage status to MessageStatus enum.
   * Vonage values: sent, delivered, read, failed
   */
  mapAckStatusToMessageStatus(vonageStatus: string): MessageStatus | null {
    const normalized = vonageStatus?.toLowerCase().trim();
    switch (normalized) {
      case 'sent':
        return MessageStatus.SENT;
      case 'delivered':
        return MessageStatus.DELIVERED;
      case 'read':
        return MessageStatus.READ;
      case 'failed':
        return MessageStatus.FAILED;
      default:
        return null;
    }
  }

  /**
   * Create Vonage API specific data for sending messages
   */
  createVonageData(sendMessageDto: any, user: any, customerData: any): VonageMessageDataForSend {
    // Extract phone number from customer data
    const toNumber = customerData.number || customerData.customerPhone;

    // Validate that we have a phone number
    if (!toNumber) {
      throw new Error('Phone number is required for sending messages via Vonage');
    }

    return {
      toNumber,
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
