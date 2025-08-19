export enum MessageType {
  CONVERSATION = 'conversation',
  IMAGE_MESSAGE = 'imageMessage',
  VIDEO_MESSAGE = 'videoMessage',
  AUDIO_MESSAGE = 'audioMessage',
  DOCUMENT_MESSAGE = 'documentMessage',
  STICKER_MESSAGE = 'stickerMessage',
  CONTACT_MESSAGE = 'contactMessage',
  LOCATION_MESSAGE = 'locationMessage',
  REACTION_MESSAGE = 'reactionMessage',
}

export enum MessageFrom {
  CUSTOMER = 'Customer',
  OPERATOR = 'Operator',
  TYPEBOT = 'Typebot',
  SYSTEM = 'System'
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  PENDING = 'pending'
}

export interface Message {
  id: string;
  sessionId: string;
  evolutionMessageId?: string;
  remoteJid?: string;
  fromMe: boolean;
  instance?: string;
  pushName?: string;
  source?: string;
  messageTimestamp?: number;
  messageType: MessageType;
  from: MessageFrom;
  direction: MessageDirection;
  content?: string;
  mediaUrl?: string;
  mimetype?: string;
  caption?: string;
  fileName?: string;
  fileLength?: string;
  fileSha256?: string;
  width?: number;
  height?: number;
  seconds?: number;
  isAnimated?: boolean;
  ptt?: boolean;
  pageCount?: number;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
  contactDisplayName?: string;
  contactVcard?: string;
  reactionText?: string;
  reactionToMessageId?: string;
  senderId?: string;
  senderName?: string;
  senderPhone?: string;
  typebotMessageId?: string;
  evolutionData: Record<string, any>;
  metadata: Record<string, any>;
  status: MessageStatus;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface CreateMessageDto {
  sessionId?: string;
  evolutionMessageId?: string;
  remoteJid?: string;
  instance?: string;
  pushName?: string;  
  source?: string;
  messageTimestamp?: number;
  messageType: MessageType;
  from: MessageFrom;
  direction: MessageDirection;
  content?: string;
  mediaUrl?: string;
  mimetype?: string;
  caption?: string;
  fileName?: string;
  fileLength?: string;
  fileSha256?: string;
  width?: number;
  height?: number;
  seconds?: number;
  isAnimated?: boolean;
  ptt?: boolean;
  pageCount?: number;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
  contactDisplayName?: string;
  contactVcard?: string;
  reactionText?: string;
  reactionToMessageId?: string;
  senderId?: string;
  senderName?: string;
  senderPhone?: string;
  typebotMessageId?: string;
  evolutionData?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: MessageStatus;
}

export interface EvolutionApiMessage {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
      participant?: string;
    };
    pushName?: string;
    message: Record<string, any>;
    messageType: string;
    messageTimestamp: number;
    owner: string;
    source: string;
    mediaUrl?: string; // Minio URL for media messages
  };
  destination: string;
  date_time: string;
  sender: string;
  apikey?: string;
}

export interface MessageFilters {
  sessionId?: string;
  messageType?: MessageType;
  from?: MessageFrom;
  direction?: MessageDirection;
  senderId?: string;
  remoteJid?: string;
  fromMe?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface MessageMetrics {
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  mediaMessages: number;
  averageResponseTime: number;
} 