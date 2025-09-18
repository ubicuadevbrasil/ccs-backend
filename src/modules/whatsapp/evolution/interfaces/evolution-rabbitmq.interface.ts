// Evolution RabbitMQ Event Interfaces

export interface EvolutionRabbitMQEvent {
  local: string;
  event: string;
  instance: string;
  data: any;
  server_url: string;
  date_time: string;
  sender: string;
  apikey: string;
}

export interface MessageKey {
  remoteJid: string;
  fromMe: boolean;
  id: string;
  senderLid?: string;
  senderPn?: string;
  participant?: string;
  participantPn?: string;
  participantLid?: string;
}

export interface MessageContextInfo {
  deviceListMetadata?: any;
  deviceListMetadataVersion?: number;
  messageSecret?: string;
  paddingBytes?: string;
}

export interface WhatsAppMessage {
  conversation?: string;
  imageMessage?: any;
  videoMessage?: any;
  audioMessage?: any;
  documentMessage?: any;
  stickerMessage?: any;
  locationMessage?: any;
  contactMessage?: any;
  contactsArrayMessage?: any;
  groupInviteMessage?: any;
  listMessage?: any;
  buttonsMessage?: any;
  templateMessage?: any;
  messageContextInfo?: MessageContextInfo;
}

// Base event interfaces for each event type
export interface EvolutionApplicationStartupEvent extends EvolutionRabbitMQEvent {
  event: 'APPLICATION_STARTUP';
  data: any;
}

export interface EvolutionInstanceCreateEvent extends EvolutionRabbitMQEvent {
  event: 'INSTANCE_CREATE';
  data: any;
}

export interface EvolutionInstanceDeleteEvent extends EvolutionRabbitMQEvent {
  event: 'INSTANCE_DELETE';
  data: any;
}

export interface EvolutionQrcodeUpdatedEvent extends EvolutionRabbitMQEvent {
  event: 'QRCODE_UPDATED';
  data: any;
}

export interface EvolutionMessagesSetEvent extends EvolutionRabbitMQEvent {
  event: 'MESSAGES_SET';
  data: any;
}

export interface EvolutionMessagesUpsertEvent extends EvolutionRabbitMQEvent {
  event: 'MESSAGES_UPSERT';
  data: {
    key: MessageKey;
    pushName: string;
    status: 'DELIVERY_ACK' | 'READ' | 'SENT' | 'FAILED';
    message: WhatsAppMessage;
    contextInfo?: any;
    messageType: 'conversation' | 'imageMessage' | 'videoMessage' | 'audioMessage' | 'documentMessage' | 'stickerMessage' | 'locationMessage' | 'contactMessage' | 'listMessage' | 'buttonsMessage' | 'templateMessage';
    messageTimestamp: number;
    instanceId: string;
    source: 'android' | 'ios' | 'web' | 'unknown';
  };
}

export interface EvolutionMessagesEditedEvent extends EvolutionRabbitMQEvent {
  event: 'MESSAGES_EDITED';
  data: any;
}

export interface EvolutionMessagesUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'MESSAGES_UPDATE';
  data: {
    key: MessageKey;
    update: {
      status?: 'READ' | 'DELIVERY_ACK';
      messageTimestamp?: number;
    };
  };
}

export interface EvolutionMessagesDeleteEvent extends EvolutionRabbitMQEvent {
  event: 'MESSAGES_DELETE';
  data: any;
}

export interface EvolutionSendMessageEvent extends EvolutionRabbitMQEvent {
  event: 'SEND_MESSAGE';
  data: any;
}

export interface EvolutionSendMessageUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'SEND_MESSAGE_UPDATE';
  data: any;
}

export interface EvolutionContactsSetEvent extends EvolutionRabbitMQEvent {
  event: 'CONTACTS_SET';
  data: any;
}

export interface EvolutionContactsUpsertEvent extends EvolutionRabbitMQEvent {
  event: 'CONTACTS_UPSERT';
  data: any;
}

export interface EvolutionContactsUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'CONTACTS_UPDATE';
  data: any;
}

export interface EvolutionPresenceUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'PRESENCE_UPDATE';
  data: {
    id: string;
    presences: {
      [key: string]: 'unavailable' | 'available' | 'composing' | 'recording' | 'paused';
    };
  };
}

export interface EvolutionChatsSetEvent extends EvolutionRabbitMQEvent {
  event: 'CHATS_SET';
  data: any;
}

export interface EvolutionChatsUpsertEvent extends EvolutionRabbitMQEvent {
  event: 'CHATS_UPSERT';
  data: any;
}

export interface EvolutionChatsUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'CHATS_UPDATE';
  data: any;
}

export interface EvolutionChatsDeleteEvent extends EvolutionRabbitMQEvent {
  event: 'CHATS_DELETE';
  data: any;
}

export interface EvolutionGroupsUpsertEvent extends EvolutionRabbitMQEvent {
  event: 'GROUPS_UPSERT';
  data: any;
}

export interface EvolutionGroupUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'GROUP_UPDATE';
  data: any;
}

export interface EvolutionGroupParticipantsUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'GROUP_PARTICIPANTS_UPDATE';
  data: any;
}

export interface EvolutionConnectionUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'CONNECTION_UPDATE';
  data: {
    instanceId: string;
    state: 'open' | 'connecting' | 'close';
    qr?: string;
  };
}

export interface EvolutionRemoveInstanceEvent extends EvolutionRabbitMQEvent {
  event: 'REMOVE_INSTANCE';
  data: any;
}

export interface EvolutionLogoutInstanceEvent extends EvolutionRabbitMQEvent {
  event: 'LOGOUT_INSTANCE';
  data: any;
}

export interface EvolutionCallEvent extends EvolutionRabbitMQEvent {
  event: 'CALL';
  data: any;
}

export interface EvolutionTypebotStartEvent extends EvolutionRabbitMQEvent {
  event: 'TYPEBOT_START';
  data: any;
}

export interface EvolutionTypebotChangeStatusEvent extends EvolutionRabbitMQEvent {
  event: 'TYPEBOT_CHANGE_STATUS';
  data: any;
}

// Union type for all possible Evolution events
export type EvolutionEvent = 
  | EvolutionApplicationStartupEvent
  | EvolutionInstanceCreateEvent
  | EvolutionInstanceDeleteEvent
  | EvolutionQrcodeUpdatedEvent
  | EvolutionMessagesSetEvent
  | EvolutionMessagesUpsertEvent
  | EvolutionMessagesEditedEvent
  | EvolutionMessagesUpdateEvent
  | EvolutionMessagesDeleteEvent
  | EvolutionSendMessageEvent
  | EvolutionSendMessageUpdateEvent
  | EvolutionContactsSetEvent
  | EvolutionContactsUpsertEvent
  | EvolutionContactsUpdateEvent
  | EvolutionPresenceUpdateEvent
  | EvolutionChatsSetEvent
  | EvolutionChatsUpsertEvent
  | EvolutionChatsUpdateEvent
  | EvolutionChatsDeleteEvent
  | EvolutionGroupsUpsertEvent
  | EvolutionGroupUpdateEvent
  | EvolutionGroupParticipantsUpdateEvent
  | EvolutionConnectionUpdateEvent
  | EvolutionRemoveInstanceEvent
  | EvolutionLogoutInstanceEvent
  | EvolutionCallEvent
  | EvolutionTypebotStartEvent
  | EvolutionTypebotChangeStatusEvent;
