import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, IsBoolean, IsNumber, IsArray, IsDateString } from 'class-validator';

// Base key structure for all events
export class EvolutionWebhookKeyDto {
  @ApiProperty({ description: 'Remote JID (phone number)' })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @ApiProperty({ description: 'Whether message is from me' })
  @IsBoolean()
  fromMe: boolean;

  @ApiProperty({ description: 'Message ID' })
  @IsString()
  @IsNotEmpty()
  id: string;
}

// Typebot session parameters
export class TypebotSessionParametersDto {
  @ApiProperty({ description: 'API key for typebot' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({ description: 'Owner JID' })
  @IsString()
  @IsNotEmpty()
  ownerJid: string;

  @ApiProperty({ description: 'Push name' })
  @IsString()
  @IsNotEmpty()
  pushName: string;

  @ApiProperty({ description: 'Remote JID' })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @ApiProperty({ description: 'Server URL' })
  @IsString()
  @IsNotEmpty()
  serverUrl: string;

  @ApiProperty({ description: 'Instance name' })
  @IsString()
  @IsNotEmpty()
  instanceName: string;
}

// Typebot session data
export class TypebotSessionDto {
  @ApiProperty({ description: 'Session ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Remote JID' })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @ApiProperty({ description: 'Push name' })
  @IsString()
  @IsNotEmpty()
  pushName: string;

  @ApiProperty({ description: 'Session status' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ description: 'Whether awaiting user input' })
  @IsBoolean()
  awaitUser: boolean;

  @ApiProperty({ description: 'Session context', required: false })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @ApiProperty({ description: 'Session type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Created at timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Updated at timestamp' })
  @IsDateString()
  updatedAt: string;

  @ApiProperty({ description: 'Instance ID' })
  @IsString()
  @IsNotEmpty()
  instanceId: string;

  @ApiProperty({ description: 'Session parameters' })
  @IsObject()
  parameters: TypebotSessionParametersDto;

  @ApiProperty({ description: 'Bot ID' })
  @IsString()
  @IsNotEmpty()
  botId: string;
}

// Typebot instance data
export class TypebotInstanceDto {
  @ApiProperty({ description: 'Typebot ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Whether typebot is enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'Typebot description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Typebot URL' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Typebot name' })
  @IsString()
  @IsNotEmpty()
  typebot: string;

  @ApiProperty({ description: 'Expiration time' })
  @IsNumber()
  expire: number;

  @ApiProperty({ description: 'Keyword to finish', required: false })
  @IsOptional()
  @IsString()
  keywordFinish?: string;

  @ApiProperty({ description: 'Delay message time' })
  @IsNumber()
  delayMessage: number;

  @ApiProperty({ description: 'Unknown message', required: false })
  @IsOptional()
  @IsString()
  unknownMessage?: string;

  @ApiProperty({ description: 'Whether listening from me' })
  @IsBoolean()
  listeningFromMe: boolean;

  @ApiProperty({ description: 'Whether to stop bot from me' })
  @IsBoolean()
  stopBotFromMe: boolean;

  @ApiProperty({ description: 'Whether to keep open' })
  @IsBoolean()
  keepOpen: boolean;

  @ApiProperty({ description: 'Debounce time' })
  @IsNumber()
  debounceTime: number;

  @ApiProperty({ description: 'Created at timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Updated at timestamp' })
  @IsDateString()
  updatedAt: string;

  @ApiProperty({ description: 'Ignore JIDs', required: false })
  @IsOptional()
  @IsArray()
  ignoreJids?: string[];

  @ApiProperty({ description: 'Trigger type' })
  @IsString()
  @IsNotEmpty()
  triggerType: string;

  @ApiProperty({ description: 'Trigger operator' })
  @IsString()
  @IsNotEmpty()
  triggerOperator: string;

  @ApiProperty({ description: 'Trigger value', required: false })
  @IsOptional()
  @IsString()
  triggerValue?: string;

  @ApiProperty({ description: 'Whether to split messages' })
  @IsBoolean()
  splitMessages: boolean;

  @ApiProperty({ description: 'Time per character' })
  @IsNumber()
  timePerChar: number;

  @ApiProperty({ description: 'Instance ID' })
  @IsString()
  @IsNotEmpty()
  instanceId: string;
}

// Typebot data for queue metadata
export class TypebotDataDto {
  @ApiProperty({ description: 'Typebot session data' })
  @IsObject()
  customerSession: TypebotSessionDto;

  @ApiProperty({ description: 'Additional session data', required: false })
  @IsOptional()
  @IsObject()
  additionalData?: Record<string, any>;
}

// Queue metadata for typebot flow
export class TypebotQueueMetadataDto {
  @ApiProperty({ description: 'Typebot ID', required: false })
  @IsOptional()
  @IsString()
  typebotId?: string;

  @ApiProperty({ description: 'Typebot name', required: false })
  @IsOptional()
  @IsString()
  typebotName?: string;

  @ApiProperty({ description: 'Session ID', required: false })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ description: 'Session status', required: false })
  @IsOptional()
  @IsString()
  sessionStatus?: string;

  @ApiProperty({ description: 'Whether awaiting user input', required: false })
  @IsOptional()
  @IsBoolean()
  awaitUser?: boolean;

  @ApiProperty({ description: 'Last typebot message', required: false })
  @IsOptional()
  @IsObject()
  lastTypebotMessage?: Record<string, any>;

  @ApiProperty({ description: 'Last typebot timestamp', required: false })
  @IsOptional()
  @IsDateString()
  lastTypebotTimestamp?: string;

  @ApiProperty({ description: 'Session context', required: false })
  @IsOptional()
  @IsObject()
  sessionContext?: Record<string, any>;

  @ApiProperty({ description: 'Session parameters', required: false })
  @IsOptional()
  @IsObject()
  sessionParameters?: Record<string, any>;

  @ApiProperty({ description: 'Typebot error', required: false })
  @IsOptional()
  @IsString()
  typebotError?: string;

  @ApiProperty({ description: 'Typebot error timestamp', required: false })
  @IsOptional()
  @IsDateString()
  typebotErrorTimestamp?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  additionalMetadata?: Record<string, any>;
}

// Update queue DTO for typebot flow
export class TypebotQueueUpdateDto {
  @ApiProperty({ description: 'Typebot session URL', required: false })
  @IsOptional()
  @IsString()
  typebotSessionUrl?: string;

  @ApiProperty({ description: 'Typebot data', required: false })
  @IsOptional()
  @IsObject()
  typebotData?: TypebotDataDto;

  @ApiProperty({ description: 'Queue metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: TypebotQueueMetadataDto;
}

// Messages.upsert event data
export class MessagesUpsertDataDto {
  @ApiProperty({ description: 'Message key information' })
  @IsObject()
  key: EvolutionWebhookKeyDto;

  @ApiProperty({ description: 'Push name', required: false })
  @IsOptional()
  @IsString()
  pushName?: string;

  @ApiProperty({ description: 'Message content' })
  @IsObject()
  message: Record<string, any>;

  @ApiProperty({ description: 'Message type' })
  @IsString()
  @IsNotEmpty()
  messageType: string;

  @ApiProperty({ description: 'Message timestamp' })
  @IsNumber()
  messageTimestamp: number;

  @ApiProperty({ description: 'Message owner' })
  @IsString()
  @IsNotEmpty()
  owner: string;

  @ApiProperty({ description: 'Message source' })
  @IsString()
  @IsNotEmpty()
  source: string;
}

// Messages.update event data
export class MessagesUpdateDataDto {
  @ApiProperty({ description: 'Message key information' })
  @IsObject()
  key: EvolutionWebhookKeyDto;

  @ApiProperty({ description: 'Update status' })
  @IsString()
  @IsNotEmpty()
  updateStatus: string;
}

// Messages.delete event data
export class MessagesDeleteDataDto {
  @ApiProperty({ description: 'Message key information' })
  @IsObject()
  key: EvolutionWebhookKeyDto;
}

// Connection.update event data
export class ConnectionUpdateDataDto {
  @ApiProperty({ description: 'Connection state' })
  @IsString()
  @IsNotEmpty()
  state: string;
}

// Group.participants.update event data
export class GroupParticipantsUpdateDataDto {
  @ApiProperty({ description: 'Group JID' })
  @IsString()
  @IsNotEmpty()
  groupJid: string;

  @ApiProperty({ description: 'Group participants' })
  @IsArray()
  participants: any[];
}

// Group.update event data
export class GroupUpdateDataDto {
  @ApiProperty({ description: 'Group JID' })
  @IsString()
  @IsNotEmpty()
  groupJid: string;

  @ApiProperty({ description: 'Update type' })
  @IsString()
  @IsNotEmpty()
  updateType: string;

  @ApiProperty({ description: 'Update data' })
  @IsObject()
  updateData: any;
}

// Groups.upsert event data
export class GroupsUpsertDataDto {
  @ApiProperty({ description: 'Groups array' })
  @IsArray()
  groups: any[];
}

// Send.message event data
export class SendMessageDataDto {
  @ApiProperty({ description: 'Message ID' })
  @IsString()
  @IsNotEmpty()
  messageId: string;
}

// Typebot.start event data
export class TypebotStartDataDto {
  @ApiProperty({ description: 'Typebot ID' })
  @IsString()
  @IsNotEmpty()
  typebotId: string;

  @ApiProperty({ description: 'Remote JID' })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @ApiProperty({ description: 'Session URL', required: false })
  @IsOptional()
  @IsString()
  sessionUrl?: string;
}

// Typebot.change.status event data
export class TypebotChangeStatusDataDto {
  @ApiProperty({ description: 'Typebot ID' })
  @IsString()
  @IsNotEmpty()
  typebotId: string;

  @ApiProperty({ description: 'Remote JID' })
  @IsString()
  @IsNotEmpty()
  remoteJid: string;

  @ApiProperty({ description: 'Status' })
  @IsString()
  @IsNotEmpty()
  status: string;
}

// Union type for all possible data structures
export type EvolutionWebhookDataDto = 
  | MessagesUpsertDataDto
  | MessagesUpdateDataDto
  | MessagesDeleteDataDto
  | ConnectionUpdateDataDto
  | GroupParticipantsUpdateDataDto
  | GroupUpdateDataDto
  | GroupsUpsertDataDto
  | SendMessageDataDto
  | TypebotStartDataDto
  | TypebotChangeStatusDataDto;

// Main webhook DTO
export class EvolutionWebhookDto {
  @ApiProperty({ description: 'Webhook event type' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({ description: 'Evolution instance name' })
  @IsString()
  @IsNotEmpty()
  instance: string;

  @ApiProperty({ description: 'Event data' })
  @IsObject()
  data: EvolutionWebhookDataDto;

  @ApiProperty({ description: 'Webhook destination', required: false })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiProperty({ description: 'Webhook date time' })
  @IsString()
  @IsNotEmpty()
  date_time: string;

  @ApiProperty({ description: 'Webhook sender' })
  @IsString()
  @IsNotEmpty()
  sender: string;

  @ApiProperty({ description: 'API key', required: false })
  @IsOptional()
  @IsString()
  apikey?: string;
}

// Response DTO
export class WebhookResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data', required: false })
  data?: any;
}

// Typebot flow response DTO
export class TypebotFlowResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Customer phone' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ description: 'Typebot ID', required: false })
  @IsOptional()
  @IsString()
  typebotId?: string;

  @ApiProperty({ description: 'Session ID', required: false })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ description: 'Session status', required: false })
  @IsOptional()
  @IsString()
  sessionStatus?: string;

  @ApiProperty({ description: 'Typebot session URL', required: false })
  @IsOptional()
  @IsString()
  typebotSessionUrl?: string;

  @ApiProperty({ description: 'Error message', required: false })
  @IsOptional()
  @IsString()
  error?: string;
}

// Type guards for better type safety
export function isMessagesUpsertData(data: EvolutionWebhookDataDto): data is MessagesUpsertDataDto {
  return 'message' in data && 'messageType' in data && 'messageTimestamp' in data;
}

export function isMessagesUpdateData(data: EvolutionWebhookDataDto): data is MessagesUpdateDataDto {
  return 'updateStatus' in data;
}

export function isMessagesDeleteData(data: EvolutionWebhookDataDto): data is MessagesDeleteDataDto {
  return 'key' in data && !('message' in data);
}

export function isConnectionUpdateData(data: EvolutionWebhookDataDto): data is ConnectionUpdateDataDto {
  return 'state' in data;
}

export function isGroupParticipantsUpdateData(data: EvolutionWebhookDataDto): data is GroupParticipantsUpdateDataDto {
  return 'groupJid' in data && 'participants' in data;
}

export function isGroupUpdateData(data: EvolutionWebhookDataDto): data is GroupUpdateDataDto {
  return 'groupJid' in data && 'updateType' in data && 'updateData' in data;
}

export function isGroupsUpsertData(data: EvolutionWebhookDataDto): data is GroupsUpsertDataDto {
  return 'groups' in data;
}

export function isSendMessageData(data: EvolutionWebhookDataDto): data is SendMessageDataDto {
  return 'messageId' in data;
}

export function isTypebotStartData(data: EvolutionWebhookDataDto): data is TypebotStartDataDto {
  return 'typebotId' in data && 'remoteJid' in data;
}

export function isTypebotChangeStatusData(data: EvolutionWebhookDataDto): data is TypebotChangeStatusDataDto {
  return 'typebotId' in data && 'remoteJid' in data && 'status' in data;
} 