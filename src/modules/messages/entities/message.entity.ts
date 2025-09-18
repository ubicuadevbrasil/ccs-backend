import { Expose, Exclude } from 'class-transformer';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact',
  STICKER = 'sticker',
  OTHER = 'other',
}

export enum MessagePlatform {
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  OTHER = 'other',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export interface MessageEntity {
  id: string;
  messageId: string;
  sessionId: string;
  senderId: string;
  recipientId: string;
  fromMe: boolean;
  system: boolean;
  isGroup: boolean;
  message?: string;
  media?: string;
  type: MessageType;
  platform: MessagePlatform;
  status: MessageStatus;
  metadata?: any;
  replyMessageId?: string;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Message implements MessageEntity {
  id: string;
  messageId: string;
  sessionId: string;
  senderId: string;
  recipientId: string;
  fromMe: boolean;
  system: boolean;
  isGroup: boolean;
  message?: string;
  media?: string;
  type: MessageType;
  platform: MessagePlatform;
  status: MessageStatus;
  metadata?: any;
  replyMessageId?: string;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Message>) {
    Object.assign(this, partial);
  }

  @Expose()
  get isText(): boolean {
    return this.type === MessageType.TEXT;
  }

  @Expose()
  get isMedia(): boolean {
    return [MessageType.IMAGE, MessageType.VIDEO, MessageType.AUDIO, MessageType.DOCUMENT].includes(this.type);
  }

  @Expose()
  get isFromMe(): boolean {
    return this.fromMe;
  }

  @Expose()
  get isFromSystem(): boolean {
    return this.system;
  }

  @Expose()
  get isFromCustomer(): boolean {
    return !this.fromMe;
  }

  @Expose()
  get isGroupMessage(): boolean {
    return this.isGroup;
  }

  @Expose()
  get isPending(): boolean {
    return this.status === MessageStatus.PENDING;
  }

  @Expose()
  get isSent(): boolean {
    return this.status === MessageStatus.SENT;
  }

  @Expose()
  get isDelivered(): boolean {
    return this.status === MessageStatus.DELIVERED;
  }

  @Expose()
  get isRead(): boolean {
    return this.status === MessageStatus.READ;
  }

  @Expose()
  get isFailed(): boolean {
    return this.status === MessageStatus.FAILED;
  }

  @Expose()
  get isDeleted(): boolean {
    return this.status === MessageStatus.DELETED;
  }

  @Expose()
  get hasReply(): boolean {
    return !!this.replyMessageId;
  }

  @Expose()
  get hasMedia(): boolean {
    return !!this.media;
  }

  @Expose()
  get hasMetadata(): boolean {
    return !!this.metadata;
  }

  @Expose()
  get isWhatsApp(): boolean {
    return this.platform === MessagePlatform.WHATSAPP;
  }

  @Expose()
  get isTelegram(): boolean {
    return this.platform === MessagePlatform.TELEGRAM;
  }

  @Expose()
  get isInstagram(): boolean {
    return this.platform === MessagePlatform.INSTAGRAM;
  }

  @Expose()
  get isFacebook(): boolean {
    return this.platform === MessagePlatform.FACEBOOK;
  }
}
