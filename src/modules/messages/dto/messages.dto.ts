import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { MessageType, MessageFrom, MessageDirection, MessageStatus } from '../interfaces/message.interface';

export class GetMessagesBySessionDto {
  @ApiProperty({ 
    description: 'Session ID to fetch messages for',
    example: 'session-123',
    type: 'string'
  })
  @IsString()
  sessionId: string;

  @ApiProperty({ 
    description: 'Message type filter',
    enum: MessageType,
    required: false
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiProperty({ 
    description: 'Message source filter',
    enum: MessageFrom,
    required: false
  })
  @IsOptional()
  @IsEnum(MessageFrom)
  from?: MessageFrom;

  @ApiProperty({ 
    description: 'Message direction filter',
    enum: MessageDirection,
    required: false
  })
  @IsOptional()
  @IsEnum(MessageDirection)
  direction?: MessageDirection;

  @ApiProperty({ 
    description: 'Start date filter (ISO string)',
    example: '2024-01-01T00:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ 
    description: 'End date filter (ISO string)',
    example: '2024-12-31T23:59:59Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class GetMessagesByGroupDto {
  @ApiProperty({ 
    description: 'Group ID to fetch messages for',
    example: '120363401241665225@g.us',
    type: 'string'
  })
  @IsString()
  groupId: string;

  @ApiProperty({ 
    description: 'Message type filter',
    enum: MessageType,
    required: false
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiProperty({ 
    description: 'Message source filter',
    enum: MessageFrom,
    required: false
  })
  @IsOptional()
  @IsEnum(MessageFrom)
  from?: MessageFrom;

  @ApiProperty({ 
    description: 'Message direction filter',
    enum: MessageDirection,
    required: false
  })
  @IsOptional()
  @IsEnum(MessageDirection)
  direction?: MessageDirection;

  @ApiProperty({ 
    description: 'Start date filter (ISO string)',
    example: '2024-01-01T00:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ 
    description: 'End date filter (ISO string)',
    example: '2024-12-31T23:59:59Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class MessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Evolution message ID', required: false })
  evolutionMessageId?: string;

  @ApiProperty({ description: 'Remote JID', required: false })
  remoteJid?: string;

  @ApiProperty({ description: 'Whether message is from me' })
  fromMe: boolean;

  @ApiProperty({ description: 'Instance name', required: false })
  instance?: string;

  @ApiProperty({ description: 'Push name', required: false })
  pushName?: string;

  @ApiProperty({ description: 'Message source', required: false })
  source?: string;

  @ApiProperty({ description: 'Message timestamp', required: false })
  messageTimestamp?: number;

  @ApiProperty({ description: 'Message type', enum: MessageType })
  messageType: MessageType;

  @ApiProperty({ description: 'Message source', enum: MessageFrom })
  from: MessageFrom;

  @ApiProperty({ description: 'Message direction', enum: MessageDirection })
  direction: MessageDirection;

  @ApiProperty({ description: 'Message content', required: false })
  content?: string;

  @ApiProperty({ description: 'Media URL', required: false })
  mediaUrl?: string;

  @ApiProperty({ description: 'MIME type', required: false })
  mimetype?: string;

  @ApiProperty({ description: 'Caption', required: false })
  caption?: string;

  @ApiProperty({ description: 'File name', required: false })
  fileName?: string;

  @ApiProperty({ description: 'File length', required: false })
  fileLength?: string;

  @ApiProperty({ description: 'File SHA256', required: false })
  fileSha256?: string;

  @ApiProperty({ description: 'Width', required: false })
  width?: number;

  @ApiProperty({ description: 'Height', required: false })
  height?: number;

  @ApiProperty({ description: 'Seconds', required: false })
  seconds?: number;

  @ApiProperty({ description: 'Is animated', required: false })
  isAnimated?: boolean;

  @ApiProperty({ description: 'Push to talk', required: false })
  ptt?: boolean;

  @ApiProperty({ description: 'Page count', required: false })
  pageCount?: number;

  @ApiProperty({ description: 'Latitude', required: false })
  latitude?: number;

  @ApiProperty({ description: 'Longitude', required: false })
  longitude?: number;

  @ApiProperty({ description: 'Location name', required: false })
  locationName?: string;

  @ApiProperty({ description: 'Location address', required: false })
  locationAddress?: string;

  @ApiProperty({ description: 'Contact display name', required: false })
  contactDisplayName?: string;

  @ApiProperty({ description: 'Contact vCard', required: false })
  contactVcard?: string;

  @ApiProperty({ description: 'Reaction text', required: false })
  reactionText?: string;

  @ApiProperty({ description: 'Reaction to message ID', required: false })
  reactionToMessageId?: string;

  @ApiProperty({ description: 'Sender ID', required: false })
  senderId?: string;

  @ApiProperty({ description: 'Sender name', required: false })
  senderName?: string;

  @ApiProperty({ description: 'Sender phone', required: false })
  senderPhone?: string;

  @ApiProperty({ description: 'Typebot message ID', required: false })
  typebotMessageId?: string;

  @ApiProperty({ description: 'Evolution data' })
  evolutionData: Record<string, any>;

  @ApiProperty({ description: 'Metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Message status', enum: MessageStatus })
  status: MessageStatus;

  @ApiProperty({ description: 'Sent at timestamp' })
  sentAt: Date;

  @ApiProperty({ description: 'Delivered at timestamp', required: false })
  deliveredAt?: Date;

  @ApiProperty({ description: 'Read at timestamp', required: false })
  readAt?: Date;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;
} 