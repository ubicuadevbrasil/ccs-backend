// Evolution API Interfaces

// Base API Response
export interface EvolutionApiResponse<T = any> {
  status: string;
  message?: string;
  data?: T;
  error?: string;
}

// Instance Management
export interface CreateInstanceDto {
  instanceName: string;
  token?: string;
  number?: string;
  qrcode?: boolean;
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS' | 'EVOLUTION';
  settings?: {
    rejectCall?: boolean;
    msgCall?: string;
    groupsIgnore?: boolean;
    alwaysOnline?: boolean;
    readMessages?: boolean;
    readStatus?: boolean;
    syncFullHistory?: boolean;
  };
  proxy?: {
    proxyHost?: string;
    proxyPort?: string;
    proxyProtocol?: string;
    proxyUsername?: string;
    proxyPassword?: string;
  };
  webhook?: {
    url?: string;
    byEvents?: boolean;
    base64?: boolean;
    headers?: Record<string, string>;
    events?: string[];
  };
  rabbitmq?: {
    enabled?: boolean;
    events?: string[];
  };
  sqs?: {
    enabled?: boolean;
    events?: string[];
  };
  chatwootAccountId?: string;
  chatwootToken?: string;
  chatwootUrl?: string;
  chatwootSignMsg?: boolean;
  chatwootReopenConversation?: boolean;
  chatwootConversationPending?: boolean;
  chatwootImportContacts?: boolean;
  chatwootNameInbox?: string;
  chatwootMergeBrazilContacts?: boolean;
  chatwootImportMessages?: boolean;
  chatwootDaysLimitImportMessages?: number;
  chatwootOrganization?: string;
  chatwootLogo?: string;
}

export interface InstanceResponse {
  hash: string;
  qrcode?: {
    base64: string;
  };
}

export interface InstanceInfo {
  instanceName: string;
  instanceId: string;
  status: string;
  qrcode?: string;
}

// Message Types
export interface SendTextDto {
  number: string;
  text: string;
  delay?: number;
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
}

export interface SendMediaDto {
  number: string;
  mediatype: 'image' | 'video' | 'document';
  mimetype: string;
  caption?: string;
  media: string; // url or base64
  fileName: string;
  delay?: number;
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };
  mentionsEveryOne?: boolean;
  mentioned?: string[];
}

export interface SendPtvDto {
  number: string;
  video: string; // url or base64
  delay?: number;
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };
  mentionsEveryOne?: boolean;
  mentioned?: string[];
}

export interface SendVideoDto {
  number: string;
  video: string; // url or base64
  caption?: string;
}
  
export interface SendAudioDto {
  number: string;
  audio: string; // url or base64
  delay?: number;
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };
  mentionsEveryOne?: boolean;
  mentioned?: string[];
  encoding?: boolean;
}

export interface SendStatusDto {
  type: 'text' | 'image' | 'video' | 'audio';
  content: string; // text or url
  caption?: string;
  backgroundColor?: string;
  font?: 1 | 2 | 3 | 4 | 5;
  allContacts?: boolean;
  statusJidList?: string[];
}

export interface SendStickerDto {
  number: string;
  sticker: string; // url or base64
  delay?: number;
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };
  mentionsEveryOne?: boolean;
  mentioned?: string[];
}

export interface SendLocationDto {
  number: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  delay?: number;
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };
  mentionsEveryOne?: boolean;
  mentioned?: string[];
}

export interface ContactInfo {
  fullName: string;
  wuid: string;
  phoneNumber: string;
  organization?: string;
  email?: string;
  url?: string;
}

export interface SendContactDto {
  number: string;
  contact: ContactInfo[];
}

export interface SendReactionDto {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  reaction: string;
}

export interface SendPollDto {
  number: string;
  name: string;
  selectableCount: number;
  values: string[];
  delay?: number;
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };
  mentionsEveryOne?: boolean;
  mentioned?: string[];
}

export interface ListSection {
  title: string;
  rows: {
    title: string;
    description: string;
    rowId: string;
  }[];
}

export interface SendListDto {
  number: string;
  title: string;
  description: string;
  buttonText: string;
  footerText: string;
  sections: ListSection[];
  delay?: number;
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };
  mentionsEveryOne?: boolean;
  mentioned?: string[];
}

export interface Button {
  type: 'reply' | 'copy' | 'url' | 'call' | 'pix';
  displayText: string;
  id?: string;
  copyCode?: string;
  url?: string;
  phoneNumber?: string;
  currency?: string;
  name?: string;
  keyType?: 'phone' | 'email' | 'cpf' | 'cnpj' | 'random';
  key?: string;
}

export interface SendButtonDto {
  number: string;
  title: string;
  description: string;
  footer: string;
  buttons: Button[];
  delay?: number;
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };
  mentionsEveryOne?: boolean;
  mentioned?: string[];
}

// Chat Management
export interface CheckWhatsAppNumbersDto {
  numbers: string[];
}

export interface ReadMessageDto {
  remoteJid: string;
  fromMe: boolean;
  id: string;
}

export interface MarkMessagesAsReadDto {
  readMessages: ReadMessageDto[];
}

export interface ArchiveChatDto {
  lastMessage: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
  };
  chat: string;
  archive: boolean;
}

export interface MarkChatUnreadDto {
  lastMessage: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
  };
  chat: string;
}

export interface DeleteMessageDto {
  id: string;
  remoteJid: string;
  fromMe: boolean;
  participant?: string;
}

export interface FetchProfilePictureDto {
  number: string;
}

export interface GetBase64FromMediaMessageDto {
  message: {
    key: {
      id: string;
    };
  };
  convertToMp4?: boolean;
}

export interface UpdateMessageDto {
  number: string;
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  text: string;
}

export interface SendPresenceDto {
  number: string;
  delay?: number;
  presence: 'composing' | 'recording' | 'paused';
}

export interface UpdateBlockStatusDto {
  number: string;
  status: 'block' | 'unblock';
}

export interface FindContactsDto {
  where?: {
    remoteJid?: string;
  };
}

export interface FindMessagesDto {
  where?: {
    key?: {
      remoteJid?: string;
    };
  };
  page?: number;
  offset?: number;
}

export interface FindStatusMessageDto {
  where?: {
    remoteJid?: string;
    id?: string;
  };
  page?: number;
  offset?: number;
}

// Group Management
export interface CreateGroupDto {
  subject: string;
  description?: string;
  participants: string[];
}

export interface UpdateGroupPictureDto {
  image: string;
}

export interface UpdateGroupSubjectDto {
  subject: string;
}

export interface UpdateGroupDescriptionDto {
  description: string;
}

export interface SendInviteDto {
  groupJid: string;
  description: string;
  numbers: string[];
}

export interface UpdateParticipantDto {
  action: 'add' | 'remove' | 'promote' | 'demote';
  participants: string[];
}

export interface UpdateSettingDto {
  action: 'announcement' | 'not_announcement' | 'locked' | 'unlocked';
}

export interface ToggleEphemeralDto {
  expiration: 0 | 86400 | 604800 | 7776000;
}

// Settings Management
export interface SetSettingsDto {
  rejectCall?: boolean;
  msgCall?: string;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  syncFullHistory?: boolean;
  readStatus?: boolean;
}

export interface SetPresenceDto {
  presence: 'available' | 'unavailable';
}

// Proxy Management
export interface SetProxyDto {
  enabled: boolean;
  host: string;
  port: string;
  protocol: string;
  username?: string;
  password?: string;
}

// Profile Management
export interface UpdateProfileNameDto {
  name: string;
}

export interface UpdateProfileStatusDto {
  status: string;
}

export interface UpdateProfilePictureDto {
  picture: string;
}

export interface UpdatePrivacySettingsDto {
  readreceipts?: 'all' | 'none';
  profile?: 'all' | 'contacts' | 'contact_blacklist' | 'none';
  status?: 'all' | 'contacts' | 'contact_blacklist' | 'none';
  online?: 'all' | 'match_last_seen';
  last?: 'all' | 'contacts' | 'contact_blacklist' | 'none';
  groupadd?: 'all' | 'contacts' | 'contact_blacklist';
}

// Label Management
export interface HandleLabelDto {
  number: string;
  labelId: string;
  action: 'add' | 'remove';
}

// Call Management
export interface FakeCallDto {
  number: string;
  isVideo: boolean;
  callDuration: number;
}

// Template Management
export interface SendTemplateDto {
  number: string;
  name: string;
  language: string;
  webhookUrl?: string;
  components: {
    type: string;
    parameters?: {
      type: string;
      text: string;
    }[];
    sub_type?: string;
    index?: string;
  }[];
}

export interface CreateTemplateDto {
  name: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  allowCategoryChange?: boolean;
  language: string;
  webhookUrl?: string;
  components: {
    type: string;
    text?: string;
    example?: {
      body_text?: string[][];
    };
    buttons?: {
      type: string;
      text: string;
      url?: string;
    }[];
  }[];
}

// Webhook Management
export interface SetWebhookDto {
  webhook: {
    enabled: boolean;
    url: string;
    headers?: Record<string, string>;
    byEvents?: boolean;
    base64?: boolean;
    events?: string[];
  };
}

// RabbitMQ Management
export interface SetRabbitMQDto {
  rabbitmq: {
    enabled: boolean;
    events?: string[];
  };
}

// SQS Management
export interface SetSQSDto {
  sqs: {
    enabled: boolean;
    events?: string[];
  };
}

// Chatwoot Management
export interface SetChatwootDto {
  enabled: boolean;
  accountId: string;
  token: string;
  url: string;
  signMsg?: boolean;
  reopenConversation?: boolean;
  conversationPending?: boolean;
  nameInbox?: string;
  mergeBrazilContacts?: boolean;
  importContacts?: boolean;
  importMessages?: boolean;
  daysLimitImportMessages?: number;
  signDelimiter?: string;
  autoCreate?: boolean;
  organization?: string;
  logo?: string;
  ignoreJids?: string[];
}

// Typebot Management
export interface CreateTypebotDto {
  enabled: boolean;
  url: string;
  typebot: string;
  triggerType?: 'all' | 'keyword';
  triggerOperator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';
  triggerValue?: string;
  expire?: number;
  keywordFinish?: string;
  delayMessage?: number;
  unknownMessage?: string;
  listeningFromMe?: boolean;
  stopBotFromMe?: boolean;
  keepOpen?: boolean;
  debounceTime?: number;
}

export interface UpdateTypebotDto extends CreateTypebotDto {}

export interface ChangeSessionStatusDto {
  remoteJid: string;
  status: 'opened' | 'paused' | 'closed';
}

export interface StartTypebotDto {
  url: string;
  typebot: string;
  remoteJid: string;
  startSession?: boolean;
  variables?: {
    name: string;
    value: string;
  }[];
}

// Evolution Bot Management
export interface CreateEvolutionBotDto {
  enabled: boolean;
  apiUrl: string;
  apiKey?: string;
  triggerType?: 'all' | 'keyword';
  triggerOperator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'none';
  triggerValue?: string;
  expire?: number;
  keywordFinish?: string;
  delayMessage?: number;
  unknownMessage?: string;
  listeningFromMe?: boolean;
  stopBotFromMe?: boolean;
  keepOpen?: boolean;
  debounceTime?: number;
  ignoreJids?: string[];
}

export interface UpdateEvolutionBotDto extends CreateEvolutionBotDto {}

// OpenAI Management
export interface SetOpenaiCredsDto {
  name: string;
  apiKey: string;
}

export interface CreateOpenaiBotDto {
  enabled: boolean;
  openaiCredsId: string;
  botType: 'assistant' | 'chatCompletion';
  assistantId?: string;
  functionUrl?: string;
  model?: string;
  systemMessages?: string[];
  assistantMessages?: string[];
  userMessages?: string[];
  maxTokens?: number;
  triggerType?: 'all' | 'keyword';
  triggerOperator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'none';
  triggerValue?: string;
  expire?: number;
  keywordFinish?: string;
  delayMessage?: number;
  unknownMessage?: string;
  listeningFromMe?: boolean;
  stopBotFromMe?: boolean;
  keepOpen?: boolean;
  debounceTime?: number;
  ignoreJids?: string[];
}

export interface UpdateOpenaiBotDto extends CreateOpenaiBotDto {}

// Dify Management
export interface CreateDifyBotDto {
  enabled: boolean;
  botType: 'chatBot' | 'textGenerator' | 'agent' | 'workflow';
  apiUrl: string;
  apiKey: string;
  triggerType?: 'all' | 'keyword';
  triggerOperator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'none';
  triggerValue?: string;
  expire?: number;
  keywordFinish?: string;
  delayMessage?: number;
  unknownMessage?: string;
  listeningFromMe?: boolean;
  stopBotFromMe?: boolean;
  keepOpen?: boolean;
  debounceTime?: number;
  ignoreJids?: string[];
}

export interface UpdateDifyBotDto extends CreateDifyBotDto {}

// Flowise Management
export interface CreateFlowiseBotDto {
  enabled: boolean;
  apiUrl: string;
  apiKey?: string;
  triggerType?: 'all' | 'keyword';
  triggerOperator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'none';
  triggerValue?: string;
  expire?: number;
  keywordFinish?: string;
  delayMessage?: number;
  unknownMessage?: string;
  listeningFromMe?: boolean;
  stopBotFromMe?: boolean;
  keepOpen?: boolean;
  debounceTime?: number;
  ignoreJids?: string[];
}

export interface UpdateFlowiseBotDto extends CreateFlowiseBotDto {}

// S3 Storage
export interface GetMediaDto {
  id?: string;
  type?: string;
  messageId?: string;
}

export interface GetMediaUrlDto {
  id: string;
  type?: string;
  messageId?: string;
}

// Default Settings
export interface SetDefaultSettingsDto {
  expire?: number;
  keywordFinish?: string;
  delayMessage?: number;
  unknownMessage?: string;
  listeningFromMe?: boolean;
  stopBotFromMe?: boolean;
  keepOpen?: boolean;
  debounceTime?: number;
  ignoreJids?: string[];
  typebotIdFallback?: string;
  botIdFallback?: string;
  openaiIdFallback?: string;
  difyIdFallback?: string;
  flowiseIdFallback?: string;
  openaiCredsId?: string;
} 