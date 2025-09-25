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

export interface DeviceListMetadata {
  senderKeyHash: string;
  senderTimestamp: string;
  recipientKeyHash: string;
  recipientTimestamp: string;
}

export interface MessageContextInfo {
  deviceListMetadata?: DeviceListMetadata;
  deviceListMetadataVersion?: number;
  messageSecret?: string;
  paddingBytes?: string;
  mentionedJid?: string[];
}

export interface StickerMessage {
  url: string;
  fileSha256: string;
  fileEncSha256: string;
  mediaKey: string;
  mimetype: string;
  directPath: string;
  fileLength: string;
  mediaKeyTimestamp: string;
  firstFrameLength?: number;
  firstFrameSidecar?: string;
  isAnimated: boolean;
  stickerSentTs: string;
  isAvatar: boolean;
  isAiSticker: boolean;
  isLottie: boolean;
}

export interface ImageMessage {
  caption?: string;
  url: string;
  mimetype: string;
  fileSha256: string;
  fileLength: string;
  height: number;
  width: number;
  mediaKey: string;
  fileEncSha256: string;
  directPath: string;
  mediaKeyTimestamp: string;
  jpegThumbnail?: string;
  contextInfo?: any;
  scansSidecar?: string;
  scanLengths?: number[];
  midQualityFileSha256?: string;
}

export interface VideoMessage {
  caption?: string;
  url: string;
  mimetype: string;
  fileSha256: string;
  fileLength: string;
  seconds: number;
  mediaKey: string;
  height: number;
  width: number;
  fileEncSha256: string;
  directPath: string;
  mediaKeyTimestamp: string;
  jpegThumbnail?: string;
  contextInfo?: any;
  streamingSidecar?: string;
  externalShareFullVideoDurationInSeconds?: number;
}

export interface PtvMessage {
  caption?: string;
  url: string;
  mimetype: string;
  fileSha256: string;
  fileLength: string;
  seconds: number;
  mediaKey: string;
  height: number;
  width: number;
  fileEncSha256: string;
  directPath: string;
  mediaKeyTimestamp: string;
  jpegThumbnail?: string;
  streamingSidecar?: string;
  externalShareFullVideoDurationInSeconds?: number;
}

export interface AudioMessage {
  url: string;
  mimetype: string;
  fileSha256: string;
  fileLength: string;
  seconds: number;
  ptt: boolean;
  mediaKey: string;
  fileEncSha256: string;
  directPath: string;
  mediaKeyTimestamp: string;
  waveform?: string;
}

export interface LocationMessage {
  degreesLatitude: number;
  degreesLongitude: number;
  jpegThumbnail?: string;
}

export interface ContactMessage {
  displayName: string;
  vcard: string;
}

export interface PollOption {
  optionName: string;
}

export interface PollCreationMessage {
  name: string;
  options: PollOption[];
  selectableOptionsCount: number;
}

export interface EventLocation {
  degreesLatitude: number;
  degreesLongitude: number;
  name: string;
}

export interface EventMessage {
  isCanceled: boolean;
  name: string;
  location: EventLocation;
  joinLink: string;
  startTime: string;
  endTime: string;
  extraGuestsAllowed: boolean;
  isScheduleCall: boolean;
}

export interface InteractiveButton {
  name: string;
  buttonParamsJson: string;
}

export interface NativeFlowMessage {
  buttons: InteractiveButton[];
}

export interface InteractiveMessage {
  nativeFlowMessage: NativeFlowMessage;
}

export interface SenderKeyDistributionMessage {
  groupId: string;
  axolotlSenderKeyDistributionMessage: string;
}

export interface ReactionMessage {
  key: MessageKey;
  text: string;
  senderTimestampMs: string;
}

export interface WhatsAppMessage {
  conversation?: string;
  imageMessage?: ImageMessage;
  videoMessage?: VideoMessage;
  audioMessage?: AudioMessage;
  documentMessage?: any;
  stickerMessage?: StickerMessage;
  ptvMessage?: PtvMessage;
  locationMessage?: LocationMessage;
  contactMessage?: ContactMessage;
  pollCreationMessageV3?: PollCreationMessage;
  eventMessage?: EventMessage;
  interactiveMessage?: InteractiveMessage;
  senderKeyDistributionMessage?: SenderKeyDistributionMessage;
  reactionMessage?: ReactionMessage;
  contactsArrayMessage?: any;
  groupInviteMessage?: any;
  listMessage?: any;
  buttonsMessage?: any;
  templateMessage?: any;
  messageContextInfo?: MessageContextInfo;
  mediaUrl?: string;
}

// Base event interfaces for each event type
export interface EvolutionApplicationStartupEvent extends EvolutionRabbitMQEvent {
  event: 'APPLICATION_STARTUP';
  data: any;
}

export interface EvolutionInstanceCreateEvent extends EvolutionRabbitMQEvent {
  event: 'INSTANCE_CREATE';
  data: {
    instanceName: string;
    instanceId: string;
  };
}

export interface EvolutionInstanceDeleteEvent extends EvolutionRabbitMQEvent {
  event: 'INSTANCE_DELETE';
  data: {
    instanceName: string;
    instanceId: string;
  };
}

export interface EvolutionQrcodeUpdatedEvent extends EvolutionRabbitMQEvent {
  event: 'QRCODE_UPDATED';
  data: any;
}

export interface EvolutionMessagesSetEvent extends EvolutionRabbitMQEvent {
  event: 'MESSAGES_SET';
  data: any;
}

export interface MessageContextInfoData {
  mentionedJid?: string[];
  conversionSource?: string;
  conversionDelaySeconds?: number;
  expiration?: number;
  ephemeralSettingTimestamp?: string;
  disappearingMode?: {
    initiator: string;
  };
  pairedMediaType?: string;
}

export interface EvolutionMessagesUpsertEvent extends EvolutionRabbitMQEvent {
  event: 'MESSAGES_UPSERT';
  data: {
    key: MessageKey;
    pushName: string;
    status: 'DELIVERY_ACK' | 'READ' | 'SENT' | 'FAILED';
    message: WhatsAppMessage;
    contextInfo?: MessageContextInfoData;
    messageType: 'conversation' | 'imageMessage' | 'videoMessage' | 'audioMessage' | 'documentMessage' | 'stickerMessage' | 'locationMessage' | 'contactMessage' | 'listMessage' | 'buttonsMessage' | 'templateMessage' | 'ptvMessage' | 'pollCreationMessageV3' | 'eventMessage' | 'interactiveMessage' | 'senderKeyDistributionMessage' | 'reactionMessage';
    messageTimestamp: number;
    instanceId: string;
    source: 'android' | 'ios' | 'web' | 'unknown';
  };
}

// New interface for the actual RabbitMQ event structure
export interface EvolutionRabbitMQEventWrapper {
  timestamp: string;
  eventType: string;
  event: EvolutionMessagesUpsertEvent;
}

export interface EvolutionMessagesEditedEvent extends EvolutionRabbitMQEvent {
  event: 'MESSAGES_EDITED';
  data: {
    key: MessageKey;
    type: 'MESSAGE_EDIT';
    editedMessage: WhatsAppMessage;
    timestampMs: string;
  };
}

export interface EvolutionMessagesUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'MESSAGES_UPDATE';
  data: {
    keyId: string;
    remoteJid: string;
    fromMe: boolean;
    participant: string;
    status: 'SERVER_ACK' | 'DELIVERY_ACK' | 'READ' | 'PLAYED';
    instanceId: string;
    messageId: string;
  };
}

export interface EvolutionMessagesDeleteEvent extends EvolutionRabbitMQEvent {
  event: 'MESSAGES_DELETE';
  data: any;
}

export interface EvolutionSendMessageEvent extends EvolutionRabbitMQEvent {
  event: 'SEND_MESSAGE';
  data: {
    key: MessageKey;
    pushName: string;
    status: 'PENDING';
    message: WhatsAppMessage;
    contextInfo?: MessageContextInfoData | null;
    messageType: 'conversation' | 'imageMessage' | 'videoMessage' | 'audioMessage' | 'documentMessage' | 'stickerMessage' | 'locationMessage' | 'contactMessage' | 'listMessage' | 'buttonsMessage' | 'templateMessage' | 'ptvMessage' | 'pollCreationMessageV3' | 'eventMessage' | 'interactiveMessage' | 'senderKeyDistributionMessage' | 'reactionMessage';
    messageTimestamp: number;
    instanceId: string;
    source: 'unknown';
  };
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

export interface ContactUpdate {
  remoteJid: string;
  pushName?: string;
  profilePicUrl?: string;
  instanceId: string;
}

export interface EvolutionContactsUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'CONTACTS_UPDATE';
  data: ContactUpdate | ContactUpdate[];
}

export interface PresenceInfo {
  lastKnownPresence: 'unavailable' | 'available' | 'composing' | 'recording' | 'paused';
}

export interface EvolutionPresenceUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'PRESENCE_UPDATE';
  data: {
    id: string;
    presences: Record<string, PresenceInfo>;
  };
}

export interface EvolutionChatsSetEvent extends EvolutionRabbitMQEvent {
  event: 'CHATS_SET';
  data: any;
}

export interface ChatUpsert {
  remoteJid: string;
  instanceId: string;
  name?: string;
  unreadMessages: number;
}

export interface EvolutionChatsUpsertEvent extends EvolutionRabbitMQEvent {
  event: 'CHATS_UPSERT';
  data: ChatUpsert[];
}

export interface ChatUpdate {
  remoteJid: string;
  instanceId: string;
}

export interface EvolutionChatsUpdateEvent extends EvolutionRabbitMQEvent {
  event: 'CHATS_UPDATE';
  data: ChatUpdate[];
}

export interface EvolutionChatsDeleteEvent extends EvolutionRabbitMQEvent {
  event: 'CHATS_DELETE';
  data: any;
}

export interface GroupParticipant {
  id: string;
  jid: string;
  lid: string;
  admin: string | null;
}

export interface GroupUpsert {
  id: string;
  subject: string;
  subjectOwner: string;
  subjectTime: number;
  size: number;
  creation: number;
  owner: string;
  owner_country_code: string;
  restrict: boolean;
  announce: boolean;
  isCommunity: boolean;
  isCommunityAnnounce: boolean;
  joinApprovalMode: boolean;
  memberAddMode: boolean;
  participants: GroupParticipant[];
  author: string;
}

export interface EvolutionGroupsUpsertEvent extends EvolutionRabbitMQEvent {
  event: 'GROUPS_UPSERT';
  data: GroupUpsert[];
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
    instance: string;
    state: 'open' | 'connecting' | 'close';
    statusReason: number;
    wuid?: string;
    profileName?: string;
    profilePictureUrl?: string | null;
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
