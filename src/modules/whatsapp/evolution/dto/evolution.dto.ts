import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Base DTOs for validation
export class CreateInstanceDto {
  @IsString()
  instanceName: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsBoolean()
  qrcode?: boolean;

  @IsOptional()
  @IsEnum(['WHATSAPP-BAILEYS', 'WHATSAPP-BUSINESS', 'EVOLUTION'])
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS' | 'EVOLUTION';
}

export class SendTextDto {
  @IsString()
  number: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsNumber()
  delay?: number;
}

export class SendMediaDto {
  @IsString()
  number: string;

  @IsEnum(['image', 'video', 'document'])
  mediatype: 'image' | 'video' | 'document';

  @IsString()
  mimetype: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsString()
  media: string;

  @IsString()
  fileName: string;

  @IsOptional()
  @IsNumber()
  delay?: number;
}

export class SendPtvDto {
  @IsString()
  number: string;

  @IsString()
  video: string;

  @IsOptional()
  @IsNumber()
  delay?: number;
}

export class SendAudioDto {
  @IsString()
  number: string;

  @IsString()
  audio: string;

  @IsOptional()
  @IsNumber()
  delay?: number;

  @IsOptional()
  @IsBoolean()
  encoding?: boolean;
}

export class SendStatusDto {
  @IsEnum(['text', 'image', 'video', 'audio'])
  type: 'text' | 'image' | 'video' | 'audio';

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsNumber()
  font?: 1 | 2 | 3 | 4 | 5;

  @IsOptional()
  @IsBoolean()
  allContacts?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  statusJidList?: string[];
}

export class SendStickerDto {
  @IsString()
  number: string;

  @IsString()
  sticker: string;

  @IsOptional()
  @IsNumber()
  delay?: number;
}

export class SendLocationDto {
  @IsString()
  number: string;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  delay?: number;
}

export class ContactInfoDto {
  @IsString()
  fullName: string;

  @IsString()
  wuid: string;

  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  url?: string;
}

export class SendContactDto {
  @IsString()
  number: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactInfoDto)
  contact: ContactInfoDto[];
}

export class MessageKeyDto {
  @IsString()
  remoteJid: string;

  @IsBoolean()
  fromMe: boolean;

  @IsString()
  id: string;
}

export class SendReactionDto {
  @ValidateNested()
  @Type(() => MessageKeyDto)
  key: MessageKeyDto;

  @IsString()
  reaction: string;
}

export class SendPollDto {
  @IsString()
  number: string;

  @IsString()
  name: string;

  @IsNumber()
  selectableCount: number;

  @IsArray()
  @IsString({ each: true })
  values: string[];

  @IsOptional()
  @IsNumber()
  delay?: number;
}

export class ListRowDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  rowId: string;
}

export class ListSectionDto {
  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListRowDto)
  rows: ListRowDto[];
}

export class SendListDto {
  @IsString()
  number: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  buttonText: string;

  @IsString()
  footerText: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListSectionDto)
  sections: ListSectionDto[];

  @IsOptional()
  @IsNumber()
  delay?: number;
}

export class ButtonDto {
  @IsEnum(['reply', 'copy', 'url', 'call', 'pix'])
  type: 'reply' | 'copy' | 'url' | 'call' | 'pix';

  @IsString()
  displayText: string;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  copyCode?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['phone', 'email', 'cpf', 'cnpj', 'random'])
  keyType?: 'phone' | 'email' | 'cpf' | 'cnpj' | 'random';

  @IsOptional()
  @IsString()
  key?: string;
}

export class SendButtonDto {
  @IsString()
  number: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  footer: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ButtonDto)
  buttons: ButtonDto[];

  @IsOptional()
  @IsNumber()
  delay?: number;
}

export class CheckWhatsAppNumbersDto {
  @IsArray()
  @IsString({ each: true })
  numbers: string[];
}

export class ReadMessageDto {
  @IsString()
  remoteJid: string;

  @IsBoolean()
  fromMe: boolean;

  @IsString()
  id: string;
}

export class MarkMessagesAsReadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReadMessageDto)
  readMessages: ReadMessageDto[];
}

export class LastMessageDto {
  @ValidateNested()
  @Type(() => MessageKeyDto)
  key: MessageKeyDto;
}

export class ArchiveChatDto {
  @ValidateNested()
  @Type(() => LastMessageDto)
  lastMessage: LastMessageDto;

  @IsString()
  chat: string;

  @IsBoolean()
  archive: boolean;
}

export class MarkChatUnreadDto {
  @ValidateNested()
  @Type(() => LastMessageDto)
  lastMessage: LastMessageDto;

  @IsString()
  chat: string;
}

export class DeleteMessageDto {
  @IsString()
  id: string;

  @IsString()
  remoteJid: string;

  @IsBoolean()
  fromMe: boolean;

  @IsOptional()
  @IsString()
  participant?: string;
}

export class FetchProfilePictureDto {
  @IsString()
  number: string;
}

export class MessageKeyIdDto {
  @IsString()
  id: string;
}

export class MessageKeyWithIdDto {
  @ValidateNested()
  @Type(() => MessageKeyIdDto)
  key: MessageKeyIdDto;
}

export class GetBase64FromMediaMessageDto {
  @ValidateNested()
  @Type(() => MessageKeyWithIdDto)
  message: MessageKeyWithIdDto;

  @IsOptional()
  @IsBoolean()
  convertToMp4?: boolean;
}

export class UpdateMessageDto {
  @IsString()
  number: string;

  @ValidateNested()
  @Type(() => MessageKeyDto)
  key: MessageKeyDto;

  @IsString()
  text: string;
}

export class SendPresenceDto {
  @IsString()
  number: string;

  @IsOptional()
  @IsNumber()
  delay?: number;

  @IsEnum(['composing', 'recording', 'paused'])
  presence: 'composing' | 'recording' | 'paused';
}

export class UpdateBlockStatusDto {
  @IsString()
  number: string;

  @IsEnum(['block', 'unblock'])
  status: 'block' | 'unblock';
}

export class FindContactsWhereDto {
  @IsOptional()
  @IsString()
  id?: string;
}

export class FindContactsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FindContactsWhereDto)
  where?: FindContactsWhereDto;
}

export class FindMessagesKeyDto {
  @IsOptional()
  @IsString()
  remoteJid?: string;
}

export class FindMessagesWhereDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FindMessagesKeyDto)
  key?: FindMessagesKeyDto;
}

export class FindMessagesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FindMessagesWhereDto)
  where?: FindMessagesWhereDto;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class FindStatusMessageWhereDto {
  @IsOptional()
  @IsString()
  remoteJid?: string;

  @IsOptional()
  @IsString()
  id?: string;
}

export class FindStatusMessageDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FindStatusMessageWhereDto)
  where?: FindStatusMessageWhereDto;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class CreateGroupDto {
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  participants: string[];
}

export class UpdateGroupPictureDto {
  @IsString()
  image: string;
}

export class UpdateGroupSubjectDto {
  @IsString()
  subject: string;
}

export class UpdateGroupDescriptionDto {
  @IsString()
  description: string;
}

export class SendInviteDto {
  @IsString()
  groupJid: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  numbers: string[];
}

export class UpdateParticipantDto {
  @IsEnum(['add', 'remove', 'promote', 'demote'])
  action: 'add' | 'remove' | 'promote' | 'demote';

  @IsArray()
  @IsString({ each: true })
  participants: string[];
}

export class UpdateSettingDto {
  @IsEnum(['announcement', 'not_announcement', 'locked', 'unlocked'])
  action: 'announcement' | 'not_announcement' | 'locked' | 'unlocked';
}

export class ToggleEphemeralDto {
  @IsEnum([0, 86400, 604800, 7776000])
  expiration: 0 | 86400 | 604800 | 7776000;
}

export class SetSettingsDto {
  @IsOptional()
  @IsBoolean()
  rejectCall?: boolean;

  @IsOptional()
  @IsString()
  msgCall?: string;

  @IsOptional()
  @IsBoolean()
  groupsIgnore?: boolean;

  @IsOptional()
  @IsBoolean()
  alwaysOnline?: boolean;

  @IsOptional()
  @IsBoolean()
  readMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  syncFullHistory?: boolean;

  @IsOptional()
  @IsBoolean()
  readStatus?: boolean;
}

export class SetPresenceDto {
  @IsEnum(['available', 'unavailable'])
  presence: 'available' | 'unavailable';
}

export class SetProxyDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  host: string;

  @IsString()
  port: string;

  @IsString()
  protocol: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateProfileNameDto {
  @IsString()
  name: string;
}

export class UpdateProfileStatusDto {
  @IsString()
  status: string;
}

export class UpdateProfilePictureDto {
  @IsString()
  picture: string;
}

export class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsEnum(['all', 'none'])
  readreceipts?: 'all' | 'none';

  @IsOptional()
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  profile?: 'all' | 'contacts' | 'contact_blacklist' | 'none';

  @IsOptional()
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  status?: 'all' | 'contacts' | 'contact_blacklist' | 'none';

  @IsOptional()
  @IsEnum(['all', 'match_last_seen'])
  online?: 'all' | 'match_last_seen';

  @IsOptional()
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  last?: 'all' | 'contacts' | 'contact_blacklist' | 'none';

  @IsOptional()
  @IsEnum(['all', 'contacts', 'contact_blacklist'])
  groupadd?: 'all' | 'contacts' | 'contact_blacklist';
}

export class HandleLabelDto {
  @IsString()
  number: string;

  @IsString()
  labelId: string;

  @IsEnum(['add', 'remove'])
  action: 'add' | 'remove';
}

export class FakeCallDto {
  @IsString()
  number: string;

  @IsBoolean()
  isVideo: boolean;

  @IsNumber()
  callDuration: number;
}

export class TemplateParameterDto {
  @IsString()
  type: string;

  @IsString()
  text: string;
}

export class TemplateComponentDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateParameterDto)
  parameters?: TemplateParameterDto[];

  @IsOptional()
  @IsString()
  sub_type?: string;

  @IsOptional()
  @IsString()
  index?: string;
}

export class SendTemplateDto {
  @IsString()
  number: string;

  @IsString()
  name: string;

  @IsString()
  language: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponentDto)
  components: TemplateComponentDto[];
}

export class TemplateExampleDto {
  @IsOptional()
  @IsArray()
  @IsArray({ each: true })
  @IsString({ each: true })
  body_text?: string[][];
}

export class TemplateButtonDto {
  @IsString()
  type: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  url?: string;
}

export class CreateTemplateComponentDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateExampleDto)
  example?: TemplateExampleDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  buttons?: TemplateButtonDto[];
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsEnum(['AUTHENTICATION', 'MARKETING', 'UTILITY'])
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';

  @IsOptional()
  @IsBoolean()
  allowCategoryChange?: boolean;

  @IsString()
  language: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTemplateComponentDto)
  components: CreateTemplateComponentDto[];
}

export class WebhookConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  url: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  byEvents?: boolean;

  @IsOptional()
  @IsBoolean()
  base64?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];
}

export class SetWebhookDto {
  @ValidateNested()
  @Type(() => WebhookConfigDto)
  webhook: WebhookConfigDto;
}

export class RabbitMQConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];
}

export class SetRabbitMQDto {
  @ValidateNested()
  @Type(() => RabbitMQConfigDto)
  rabbitmq: RabbitMQConfigDto;
}

export class SQSConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];
}

export class SetSQSDto {
  @ValidateNested()
  @Type(() => SQSConfigDto)
  sqs: SQSConfigDto;
}

export class SetChatwootDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  accountId: string;

  @IsString()
  token: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsBoolean()
  signMsg?: boolean;

  @IsOptional()
  @IsBoolean()
  reopenConversation?: boolean;

  @IsOptional()
  @IsBoolean()
  conversationPending?: boolean;

  @IsOptional()
  @IsString()
  nameInbox?: string;

  @IsOptional()
  @IsBoolean()
  mergeBrazilContacts?: boolean;

  @IsOptional()
  @IsBoolean()
  importContacts?: boolean;

  @IsOptional()
  @IsBoolean()
  importMessages?: boolean;

  @IsOptional()
  @IsNumber()
  daysLimitImportMessages?: number;

  @IsOptional()
  @IsString()
  signDelimiter?: string;

  @IsOptional()
  @IsBoolean()
  autoCreate?: boolean;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ignoreJids?: string[];
}

export class CreateTypebotDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  url: string;

  @IsString()
  typebot: string;

  @IsOptional()
  @IsEnum(['all', 'keyword'])
  triggerType?: 'all' | 'keyword';

  @IsOptional()
  @IsEnum(['contains', 'equals', 'startsWith', 'endsWith', 'regex'])
  triggerOperator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';

  @IsOptional()
  @IsString()
  triggerValue?: string;

  @IsOptional()
  @IsNumber()
  expire?: number;

  @IsOptional()
  @IsString()
  keywordFinish?: string;

  @IsOptional()
  @IsNumber()
  delayMessage?: number;

  @IsOptional()
  @IsString()
  unknownMessage?: string;

  @IsOptional()
  @IsBoolean()
  listeningFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  stopBotFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  keepOpen?: boolean;

  @IsOptional()
  @IsNumber()
  debounceTime?: number;
}

export class UpdateTypebotDto extends CreateTypebotDto {}

export class ChangeSessionStatusDto {
  @IsString()
  remoteJid: string;

  @IsEnum(['opened', 'paused', 'closed'])
  status: 'opened' | 'paused' | 'closed';
}

export class TypebotVariableDto {
  @IsString()
  name: string;

  @IsString()
  value: string;
}

export class StartTypebotDto {
  @IsString()
  url: string;

  @IsString()
  typebot: string;

  @IsString()
  remoteJid: string;

  @IsOptional()
  @IsBoolean()
  startSession?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TypebotVariableDto)
  variables?: TypebotVariableDto[];
}

export class CreateEvolutionBotDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  apiUrl: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsEnum(['all', 'keyword'])
  triggerType?: 'all' | 'keyword';

  @IsOptional()
  @IsEnum(['contains', 'equals', 'startsWith', 'endsWith', 'regex', 'none'])
  triggerOperator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'none';

  @IsOptional()
  @IsString()
  triggerValue?: string;

  @IsOptional()
  @IsNumber()
  expire?: number;

  @IsOptional()
  @IsString()
  keywordFinish?: string;

  @IsOptional()
  @IsNumber()
  delayMessage?: number;

  @IsOptional()
  @IsString()
  unknownMessage?: string;

  @IsOptional()
  @IsBoolean()
  listeningFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  stopBotFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  keepOpen?: boolean;

  @IsOptional()
  @IsNumber()
  debounceTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ignoreJids?: string[];
}

export class UpdateEvolutionBotDto extends CreateEvolutionBotDto {}

export class SetOpenaiCredsDto {
  @IsString()
  name: string;

  @IsString()
  apiKey: string;
}

export class CreateOpenaiBotDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  openaiCredsId: string;

  @IsEnum(['assistant', 'chatCompletion'])
  botType: 'assistant' | 'chatCompletion';

  @IsOptional()
  @IsString()
  assistantId?: string;

  @IsOptional()
  @IsString()
  functionUrl?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  systemMessages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assistantMessages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userMessages?: string[];

  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @IsOptional()
  @IsEnum(['all', 'keyword'])
  triggerType?: 'all' | 'keyword';

  @IsOptional()
  @IsEnum(['contains', 'equals', 'startsWith', 'endsWith', 'regex', 'none'])
  triggerOperator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'none';

  @IsOptional()
  @IsString()
  triggerValue?: string;

  @IsOptional()
  @IsNumber()
  expire?: number;

  @IsOptional()
  @IsString()
  keywordFinish?: string;

  @IsOptional()
  @IsNumber()
  delayMessage?: number;

  @IsOptional()
  @IsString()
  unknownMessage?: string;

  @IsOptional()
  @IsBoolean()
  listeningFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  stopBotFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  keepOpen?: boolean;

  @IsOptional()
  @IsNumber()
  debounceTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ignoreJids?: string[];
}

export class UpdateOpenaiBotDto extends CreateOpenaiBotDto {}

export class CreateDifyBotDto {
  @IsBoolean()
  enabled: boolean;

  @IsEnum(['chatBot', 'textGenerator', 'agent', 'workflow'])
  botType: 'chatBot' | 'textGenerator' | 'agent' | 'workflow';

  @IsString()
  apiUrl: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsEnum(['all', 'keyword'])
  triggerType?: 'all' | 'keyword';

  @IsOptional()
  @IsEnum(['contains', 'equals', 'startsWith', 'endsWith', 'regex', 'none'])
  triggerOperator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'none';

  @IsOptional()
  @IsString()
  triggerValue?: string;

  @IsOptional()
  @IsNumber()
  expire?: number;

  @IsOptional()
  @IsString()
  keywordFinish?: string;

  @IsOptional()
  @IsNumber()
  delayMessage?: number;

  @IsOptional()
  @IsString()
  unknownMessage?: string;

  @IsOptional()
  @IsBoolean()
  listeningFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  stopBotFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  keepOpen?: boolean;

  @IsOptional()
  @IsNumber()
  debounceTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ignoreJids?: string[];
}

export class UpdateDifyBotDto extends CreateDifyBotDto {}

export class CreateFlowiseBotDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  apiUrl: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsEnum(['all', 'keyword'])
  triggerType?: 'all' | 'keyword';

  @IsOptional()
  @IsEnum(['contains', 'equals', 'startsWith', 'endsWith', 'regex', 'none'])
  triggerOperator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'none';

  @IsOptional()
  @IsString()
  triggerValue?: string;

  @IsOptional()
  @IsNumber()
  expire?: number;

  @IsOptional()
  @IsString()
  keywordFinish?: string;

  @IsOptional()
  @IsNumber()
  delayMessage?: number;

  @IsOptional()
  @IsString()
  unknownMessage?: string;

  @IsOptional()
  @IsBoolean()
  listeningFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  stopBotFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  keepOpen?: boolean;

  @IsOptional()
  @IsNumber()
  debounceTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ignoreJids?: string[];
}

export class UpdateFlowiseBotDto extends CreateFlowiseBotDto {}

export class GetMediaDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  messageId?: string;
}

export class GetMediaUrlDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  messageId?: string;
}

export class SetDefaultSettingsDto {
  @IsOptional()
  @IsNumber()
  expire?: number;

  @IsOptional()
  @IsString()
  keywordFinish?: string;

  @IsOptional()
  @IsNumber()
  delayMessage?: number;

  @IsOptional()
  @IsString()
  unknownMessage?: string;

  @IsOptional()
  @IsBoolean()
  listeningFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  stopBotFromMe?: boolean;

  @IsOptional()
  @IsBoolean()
  keepOpen?: boolean;

  @IsOptional()
  @IsNumber()
  debounceTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ignoreJids?: string[];

  @IsOptional()
  @IsString()
  typebotIdFallback?: string;

  @IsOptional()
  @IsString()
  botIdFallback?: string;

  @IsOptional()
  @IsString()
  openaiIdFallback?: string;

  @IsOptional()
  @IsString()
  difyIdFallback?: string;

  @IsOptional()
  @IsString()
  flowiseIdFallback?: string;

  @IsOptional()
  @IsString()
  openaiCredsId?: string;
}

// Evolution RabbitMQ Event DTOs
export class EvolutionMessageKeyDto {
  @IsString()
  remoteJid: string;

  @IsBoolean()
  fromMe: boolean;

  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  senderLid?: string;

  @IsOptional()
  @IsString()
  senderPn?: string;

  @IsOptional()
  @IsString()
  participant?: string;

  @IsOptional()
  @IsString()
  participantPn?: string;

  @IsOptional()
  @IsString()
  participantLid?: string;
}

export class EvolutionDeviceListMetadataDto {
  @IsString()
  senderKeyHash: string;

  @IsString()
  senderTimestamp: string;

  @IsString()
  recipientKeyHash: string;

  @IsString()
  recipientTimestamp: string;
}

export class EvolutionMessageContextInfoDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionDeviceListMetadataDto)
  deviceListMetadata?: EvolutionDeviceListMetadataDto;

  @IsOptional()
  @IsNumber()
  deviceListMetadataVersion?: number;

  @IsOptional()
  @IsString()
  messageSecret?: string;

  @IsOptional()
  @IsString()
  paddingBytes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionedJid?: string[];
}

export class EvolutionStickerMessageDto {
  @IsString()
  url: string;

  @IsString()
  fileSha256: string;

  @IsString()
  fileEncSha256: string;

  @IsString()
  mediaKey: string;

  @IsString()
  mimetype: string;

  @IsString()
  directPath: string;

  @IsString()
  fileLength: string;

  @IsString()
  mediaKeyTimestamp: string;

  @IsOptional()
  @IsNumber()
  firstFrameLength?: number;

  @IsOptional()
  @IsString()
  firstFrameSidecar?: string;

  @IsBoolean()
  isAnimated: boolean;

  @IsString()
  stickerSentTs: string;

  @IsBoolean()
  isAvatar: boolean;

  @IsBoolean()
  isAiSticker: boolean;

  @IsBoolean()
  isLottie: boolean;
}

export class EvolutionImageMessageDto {
  @IsString()
  url: string;

  @IsString()
  mimetype: string;

  @IsString()
  fileSha256: string;

  @IsString()
  fileLength: string;

  @IsNumber()
  height: number;

  @IsNumber()
  width: number;

  @IsString()
  mediaKey: string;

  @IsString()
  fileEncSha256: string;

  @IsString()
  directPath: string;

  @IsString()
  mediaKeyTimestamp: string;

  @IsOptional()
  @IsString()
  jpegThumbnail?: string;

  @IsOptional()
  @IsObject()
  contextInfo?: any;

  @IsOptional()
  @IsString()
  scansSidecar?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  scanLengths?: number[];

  @IsOptional()
  @IsString()
  midQualityFileSha256?: string;
}

export class EvolutionVideoMessageDto {
  @IsString()
  url: string;

  @IsString()
  mimetype: string;

  @IsString()
  fileSha256: string;

  @IsString()
  fileLength: string;

  @IsNumber()
  seconds: number;

  @IsString()
  mediaKey: string;

  @IsNumber()
  height: number;

  @IsNumber()
  width: number;

  @IsString()
  fileEncSha256: string;

  @IsString()
  directPath: string;

  @IsString()
  mediaKeyTimestamp: string;

  @IsOptional()
  @IsString()
  jpegThumbnail?: string;

  @IsOptional()
  @IsObject()
  contextInfo?: any;

  @IsOptional()
  @IsString()
  streamingSidecar?: string;

  @IsOptional()
  @IsNumber()
  externalShareFullVideoDurationInSeconds?: number;
}

export class EvolutionPtvMessageDto {
  @IsString()
  url: string;

  @IsString()
  mimetype: string;

  @IsString()
  fileSha256: string;

  @IsString()
  fileLength: string;

  @IsNumber()
  seconds: number;

  @IsString()
  mediaKey: string;

  @IsNumber()
  height: number;

  @IsNumber()
  width: number;

  @IsString()
  fileEncSha256: string;

  @IsString()
  directPath: string;

  @IsString()
  mediaKeyTimestamp: string;

  @IsOptional()
  @IsString()
  jpegThumbnail?: string;

  @IsOptional()
  @IsString()
  streamingSidecar?: string;

  @IsOptional()
  @IsNumber()
  externalShareFullVideoDurationInSeconds?: number;
}

export class EvolutionAudioMessageDto {
  @IsString()
  url: string;

  @IsString()
  mimetype: string;

  @IsString()
  fileSha256: string;

  @IsString()
  fileLength: string;

  @IsNumber()
  seconds: number;

  @IsBoolean()
  ptt: boolean;

  @IsString()
  mediaKey: string;

  @IsString()
  fileEncSha256: string;

  @IsString()
  directPath: string;

  @IsString()
  mediaKeyTimestamp: string;

  @IsOptional()
  @IsString()
  waveform?: string;
}

export class EvolutionLocationMessageDto {
  @IsNumber()
  degreesLatitude: number;

  @IsNumber()
  degreesLongitude: number;

  @IsOptional()
  @IsString()
  jpegThumbnail?: string;
}

export class EvolutionContactMessageDto {
  @IsString()
  displayName: string;

  @IsString()
  vcard: string;
}

export class EvolutionPollOptionDto {
  @IsString()
  optionName: string;
}

export class EvolutionPollCreationMessageDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvolutionPollOptionDto)
  options: EvolutionPollOptionDto[];

  @IsNumber()
  selectableOptionsCount: number;
}

export class EvolutionEventLocationDto {
  @IsNumber()
  degreesLatitude: number;

  @IsNumber()
  degreesLongitude: number;

  @IsString()
  name: string;
}

export class EvolutionEventMessageDto {
  @IsBoolean()
  isCanceled: boolean;

  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => EvolutionEventLocationDto)
  location: EvolutionEventLocationDto;

  @IsString()
  joinLink: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsBoolean()
  extraGuestsAllowed: boolean;

  @IsBoolean()
  isScheduleCall: boolean;
}

export class EvolutionInteractiveButtonDto {
  @IsString()
  name: string;

  @IsString()
  buttonParamsJson: string;
}

export class EvolutionNativeFlowMessageDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvolutionInteractiveButtonDto)
  buttons: EvolutionInteractiveButtonDto[];
}

export class EvolutionInteractiveMessageDto {
  @ValidateNested()
  @Type(() => EvolutionNativeFlowMessageDto)
  nativeFlowMessage: EvolutionNativeFlowMessageDto;
}

export class EvolutionSenderKeyDistributionMessageDto {
  @IsString()
  groupId: string;

  @IsString()
  axolotlSenderKeyDistributionMessage: string;
}

export class EvolutionReactionMessageDto {
  @ValidateNested()
  @Type(() => EvolutionMessageKeyDto)
  key: EvolutionMessageKeyDto;

  @IsString()
  text: string;

  @IsString()
  senderTimestampMs: string;
}

export class EvolutionWhatsAppMessageDto {
  @IsOptional()
  @IsString()
  conversation?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionStickerMessageDto)
  stickerMessage?: EvolutionStickerMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionImageMessageDto)
  imageMessage?: EvolutionImageMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionVideoMessageDto)
  videoMessage?: EvolutionVideoMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionAudioMessageDto)
  audioMessage?: EvolutionAudioMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionPtvMessageDto)
  ptvMessage?: EvolutionPtvMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionLocationMessageDto)
  locationMessage?: EvolutionLocationMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionContactMessageDto)
  contactMessage?: EvolutionContactMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionPollCreationMessageDto)
  pollCreationMessageV3?: EvolutionPollCreationMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionEventMessageDto)
  eventMessage?: EvolutionEventMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionInteractiveMessageDto)
  interactiveMessage?: EvolutionInteractiveMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionSenderKeyDistributionMessageDto)
  senderKeyDistributionMessage?: EvolutionSenderKeyDistributionMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionReactionMessageDto)
  reactionMessage?: EvolutionReactionMessageDto;

  @IsOptional()
  @IsObject()
  documentMessage?: any;

  @IsOptional()
  @IsObject()
  contactsArrayMessage?: any;

  @IsOptional()
  @IsObject()
  groupInviteMessage?: any;

  @IsOptional()
  @IsObject()
  listMessage?: any;

  @IsOptional()
  @IsObject()
  buttonsMessage?: any;

  @IsOptional()
  @IsObject()
  templateMessage?: any;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionMessageContextInfoDto)
  messageContextInfo?: EvolutionMessageContextInfoDto;

  @IsOptional()
  @IsString()
  mediaUrl?: string;
}

export class EvolutionMessageContextInfoDataDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionedJid?: string[];

  @IsOptional()
  @IsString()
  conversionSource?: string;

  @IsOptional()
  @IsNumber()
  conversionDelaySeconds?: number;

  @IsOptional()
  @IsNumber()
  expiration?: number;

  @IsOptional()
  @IsString()
  ephemeralSettingTimestamp?: string;

  @IsOptional()
  @IsObject()
  disappearingMode?: {
    initiator: string;
  };

  @IsOptional()
  @IsString()
  pairedMediaType?: string;
}

export class EvolutionMessagesUpsertDataDto {
  @ValidateNested()
  @Type(() => EvolutionMessageKeyDto)
  key: EvolutionMessageKeyDto;

  @IsString()
  pushName: string;

  @IsEnum(['DELIVERY_ACK', 'READ', 'SENT', 'FAILED'])
  status: 'DELIVERY_ACK' | 'READ' | 'SENT' | 'FAILED';

  @ValidateNested()
  @Type(() => EvolutionWhatsAppMessageDto)
  message: EvolutionWhatsAppMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionMessageContextInfoDataDto)
  contextInfo?: EvolutionMessageContextInfoDataDto;

  @IsEnum(['conversation', 'imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'locationMessage', 'contactMessage', 'listMessage', 'buttonsMessage', 'templateMessage', 'ptvMessage', 'pollCreationMessageV3', 'eventMessage', 'interactiveMessage', 'senderKeyDistributionMessage', 'reactionMessage'])
  messageType: 'conversation' | 'imageMessage' | 'videoMessage' | 'audioMessage' | 'documentMessage' | 'stickerMessage' | 'locationMessage' | 'contactMessage' | 'listMessage' | 'buttonsMessage' | 'templateMessage' | 'ptvMessage' | 'pollCreationMessageV3' | 'eventMessage' | 'interactiveMessage' | 'senderKeyDistributionMessage' | 'reactionMessage';

  @IsNumber()
  messageTimestamp: number;

  @IsString()
  instanceId: string;

  @IsEnum(['android', 'ios', 'web', 'unknown'])
  source: 'android' | 'ios' | 'web' | 'unknown';
}

export class EvolutionMessagesUpsertEventDto {
  @IsString()
  event: string;

  @IsString()
  instance: string;

  @ValidateNested()
  @Type(() => EvolutionMessagesUpsertDataDto)
  data: EvolutionMessagesUpsertDataDto;

  @IsString()
  server_url: string;

  @IsString()
  date_time: string;

  @IsString()
  sender: string;

  @IsString()
  apikey: string;
}

export class EvolutionPresenceInfoDto {
  @IsEnum(['unavailable', 'available', 'composing', 'recording', 'paused'])
  lastKnownPresence: 'unavailable' | 'available' | 'composing' | 'recording' | 'paused';
}

export class EvolutionPresenceUpdateDataDto {
  @IsString()
  id: string;

  @IsObject()
  presences: Record<string, EvolutionPresenceInfoDto>;
}

export class EvolutionContactUpdateDto {
  @IsString()
  remoteJid: string;

  @IsOptional()
  @IsString()
  pushName?: string;

  @IsOptional()
  @IsString()
  profilePicUrl?: string;

  @IsString()
  instanceId: string;
}

export class EvolutionChatUpdateDto {
  @IsString()
  remoteJid: string;

  @IsString()
  instanceId: string;
}

export class EvolutionSendMessageDataDto {
  @ValidateNested()
  @Type(() => EvolutionMessageKeyDto)
  key: EvolutionMessageKeyDto;

  @IsString()
  pushName: string;

  @IsEnum(['PENDING'])
  status: 'PENDING';

  @ValidateNested()
  @Type(() => EvolutionWhatsAppMessageDto)
  message: EvolutionWhatsAppMessageDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EvolutionMessageContextInfoDataDto)
  contextInfo?: EvolutionMessageContextInfoDataDto | null;

  @IsEnum(['conversation', 'imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'locationMessage', 'contactMessage', 'listMessage', 'buttonsMessage', 'templateMessage', 'ptvMessage', 'pollCreationMessageV3', 'eventMessage', 'interactiveMessage', 'senderKeyDistributionMessage', 'reactionMessage'])
  messageType: 'conversation' | 'imageMessage' | 'videoMessage' | 'audioMessage' | 'documentMessage' | 'stickerMessage' | 'locationMessage' | 'contactMessage' | 'listMessage' | 'buttonsMessage' | 'templateMessage' | 'ptvMessage' | 'pollCreationMessageV3' | 'eventMessage' | 'interactiveMessage' | 'senderKeyDistributionMessage' | 'reactionMessage';

  @IsNumber()
  messageTimestamp: number;

  @IsString()
  instanceId: string;

  @IsEnum(['unknown'])
  source: 'unknown';
}

export class EvolutionMessagesUpdateDataDto {
  @IsString()
  keyId: string;

  @IsString()
  remoteJid: string;

  @IsBoolean()
  fromMe: boolean;

  @IsString()
  participant: string;

  @IsEnum(['SERVER_ACK', 'DELIVERY_ACK', 'READ', 'PLAYED'])
  status: 'SERVER_ACK' | 'DELIVERY_ACK' | 'READ' | 'PLAYED';

  @IsString()
  instanceId: string;

  @IsString()
  messageId: string;
}

export class EvolutionMessagesUpdateEventDto {
  @IsString()
  event: string;

  @IsString()
  instance: string;

  @ValidateNested()
  @Type(() => EvolutionMessagesUpdateDataDto)
  data: EvolutionMessagesUpdateDataDto;

  @IsString()
  server_url: string;

  @IsString()
  date_time: string;

  @IsString()
  sender: string;

  @IsString()
  apikey: string;
}

export class EvolutionChatUpsertDto {
  @IsString()
  remoteJid: string;

  @IsString()
  instanceId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  unreadMessages: number;
}

export class EvolutionChatsUpsertEventDto {
  @IsString()
  event: string;

  @IsString()
  instance: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvolutionChatUpsertDto)
  data: EvolutionChatUpsertDto[];

  @IsString()
  server_url: string;

  @IsString()
  date_time: string;

  @IsString()
  sender: string;

  @IsString()
  apikey: string;
}

export class EvolutionGroupParticipantDto {
  @IsString()
  id: string;

  @IsString()
  jid: string;

  @IsString()
  lid: string;

  @IsOptional()
  @IsString()
  admin: string | null;
}

export class EvolutionGroupUpsertDto {
  @IsString()
  id: string;

  @IsString()
  subject: string;

  @IsString()
  subjectOwner: string;

  @IsNumber()
  subjectTime: number;

  @IsNumber()
  size: number;

  @IsNumber()
  creation: number;

  @IsString()
  owner: string;

  @IsString()
  owner_country_code: string;

  @IsBoolean()
  restrict: boolean;

  @IsBoolean()
  announce: boolean;

  @IsBoolean()
  isCommunity: boolean;

  @IsBoolean()
  isCommunityAnnounce: boolean;

  @IsBoolean()
  joinApprovalMode: boolean;

  @IsBoolean()
  memberAddMode: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvolutionGroupParticipantDto)
  participants: EvolutionGroupParticipantDto[];

  @IsString()
  author: string;
}

export class EvolutionGroupsUpsertEventDto {
  @IsString()
  event: string;

  @IsString()
  instance: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvolutionGroupUpsertDto)
  data: EvolutionGroupUpsertDto[];

  @IsString()
  server_url: string;

  @IsString()
  date_time: string;

  @IsString()
  sender: string;

  @IsString()
  apikey: string;
}

export class EvolutionConnectionUpdateDataDto {
  @IsString()
  instance: string;

  @IsEnum(['open', 'connecting', 'close'])
  state: 'open' | 'connecting' | 'close';

  @IsNumber()
  statusReason: number;

  @IsOptional()
  @IsString()
  wuid?: string;

  @IsOptional()
  @IsString()
  profileName?: string;

  @IsOptional()
  @IsString()
  profilePictureUrl?: string | null;
}

export class EvolutionConnectionUpdateEventDto {
  @IsString()
  event: string;

  @IsString()
  instance: string;

  @ValidateNested()
  @Type(() => EvolutionConnectionUpdateDataDto)
  data: EvolutionConnectionUpdateDataDto;

  @IsString()
  server_url: string;

  @IsString()
  date_time: string;

  @IsString()
  sender: string;

  @IsString()
  apikey: string;
}

export class EvolutionInstanceCreateDataDto {
  @IsString()
  instanceName: string;

  @IsString()
  instanceId: string;
}

export class EvolutionInstanceCreateEventDto {
  @IsString()
  event: string;

  @IsString()
  instance: string;

  @ValidateNested()
  @Type(() => EvolutionInstanceCreateDataDto)
  data: EvolutionInstanceCreateDataDto;

  @IsString()
  server_url: string;

  @IsString()
  date_time: string;

  @IsString()
  apikey: string;
}

export class EvolutionInstanceDeleteDataDto {
  @IsString()
  instanceName: string;

  @IsString()
  instanceId: string;
}

export class EvolutionInstanceDeleteEventDto {
  @IsString()
  event: string;

  @IsString()
  instance: string;

  @ValidateNested()
  @Type(() => EvolutionInstanceDeleteDataDto)
  data: EvolutionInstanceDeleteDataDto;

  @IsString()
  server_url: string;

  @IsString()
  date_time: string;

  @IsString()
  apikey: string;
}

export class EvolutionMessagesEditedDataDto {
  @ValidateNested()
  @Type(() => EvolutionMessageKeyDto)
  key: EvolutionMessageKeyDto;

  @IsEnum(['MESSAGE_EDIT'])
  type: 'MESSAGE_EDIT';

  @ValidateNested()
  @Type(() => EvolutionWhatsAppMessageDto)
  editedMessage: EvolutionWhatsAppMessageDto;

  @IsString()
  timestampMs: string;
}

export class EvolutionMessagesEditedEventDto {
  @IsString()
  event: string;

  @IsString()
  instance: string;

  @ValidateNested()
  @Type(() => EvolutionMessagesEditedDataDto)
  data: EvolutionMessagesEditedDataDto;

  @IsString()
  server_url: string;

  @IsString()
  date_time: string;

  @IsString()
  sender: string;

  @IsString()
  apikey: string;
}

export class EvolutionRabbitMQEventDto {
  @IsString()
  timestamp: string;

  @IsString()
  eventType: string;

  @ValidateNested()
  @Type(() => EvolutionMessagesUpsertEventDto)
  event: EvolutionMessagesUpsertEventDto;
} 