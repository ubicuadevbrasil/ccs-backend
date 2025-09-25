import { 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUUID, 
  IsBoolean,
  MinLength, 
  MaxLength
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType, MessagePlatform, MessageStatus, SenderType, RecipientType } from '../entities/message.entity';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Platform-specific message identifier',
    example: 'msg_123456789',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  messageId: string;

  @ApiProperty({
    description: 'Session identifier for grouping related messages',
    example: 'session_123456789',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  sessionId: string;

  @ApiProperty({
    description: 'Type of sender (system, bot, customer, user)',
    enum: SenderType,
    example: SenderType.CUSTOMER,
  })
  @IsEnum(SenderType)
  @IsNotEmpty()
  senderType: SenderType;

  @ApiProperty({
    description: 'Type of recipient (system, bot, customer, user)',
    enum: RecipientType,
    example: RecipientType.USER,
  })
  @IsEnum(RecipientType)
  @IsNotEmpty()
  recipientType: RecipientType;

  @ApiProperty({
    description: 'Customer ID (required if senderType or recipientType is customer)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  customerId: string | null;

  @ApiProperty({
    description: 'User ID (required if senderType or recipientType is user)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId: string | null;

  @ApiProperty({
    description: 'Indicates if the message was sent by the system/user (true) or received from customer (false)',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  fromMe: boolean;

  @ApiProperty({
    description: 'Indicates if this is a system message',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  system: boolean;

  @ApiProperty({
    description: 'Indicates if this is a group message',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  isGroup: boolean;

  @ApiPropertyOptional({
    description: 'Message text content',
    example: 'Hello, how can I help you?',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @ApiPropertyOptional({
    description: 'Media URL or path',
    example: 'https://example.com/image.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  media?: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT,
    default: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  @IsNotEmpty()
  type: MessageType;

  @ApiProperty({
    description: 'Platform where the message was sent/received',
    enum: MessagePlatform,
    example: MessagePlatform.WHATSAPP,
    default: MessagePlatform.WHATSAPP,
  })
  @IsEnum(MessagePlatform)
  @IsNotEmpty()
  platform: MessagePlatform;

  @ApiPropertyOptional({
    description: 'Message status',
    enum: MessageStatus,
    example: MessageStatus.PENDING,
    default: MessageStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON object)',
    example: { originalResponse: { id: '123', timestamp: '2024-01-01T10:00:00Z' } },
  })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({
    description: 'ID of the message being replied to',
    example: 'msg_123456789',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  replyMessageId?: string;
}

export class UpdateMessageDto {
  @ApiPropertyOptional({
    description: 'Message text content',
    example: 'Updated message content',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @ApiPropertyOptional({
    description: 'Media URL or path',
    example: 'https://example.com/image.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  media?: string;

  @ApiPropertyOptional({
    description: 'Message status',
    enum: MessageStatus,
    example: MessageStatus.SENT,
  })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @ApiPropertyOptional({
    description: 'Additional metadata (JSON object)',
    example: { updatedAt: '2024-01-01T10:00:00Z' },
  })
  @IsOptional()
  metadata?: any;
}

export class MessageQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Filter by session ID',
    example: 'session_123456789',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Filter by sender type',
    enum: SenderType,
    example: SenderType.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(SenderType)
  senderType?: SenderType;

  @ApiPropertyOptional({
    description: 'Filter by recipient type',
    enum: RecipientType,
    example: RecipientType.USER,
  })
  @IsOptional()
  @IsEnum(RecipientType)
  recipientType?: RecipientType;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by platform',
    enum: MessagePlatform,
    example: MessagePlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(MessagePlatform)
  platform?: MessagePlatform;

  @ApiPropertyOptional({
    description: 'Filter by message type',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({
    description: 'Filter by message status',
    enum: MessageStatus,
    example: MessageStatus.SENT,
  })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @ApiPropertyOptional({
    description: 'Filter by fromMe flag',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  fromMe?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by system flag',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  system?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by group flag',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({
    description: 'Search in message content',
    example: 'hello',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'sentAt',
    enum: ['sentAt', 'createdAt', 'updatedAt'],
    default: 'sentAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: string;
}

export class AddReactionDto {
  @ApiProperty({
    description: 'Message ID to react to',
    example: 'msg_123456789',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  messageId: string;

  @ApiProperty({
    description: 'User or customer ID who is reacting',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  reactorId: string;

  @ApiProperty({
    description: 'Reaction emoji',
    example: '👍',
    minLength: 1,
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10)
  emoji: string;
}

export class SessionMessagesQueryDto {
  @ApiProperty({
    description: 'Session ID to retrieve messages for',
    example: 'session_123456789',
  })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Number of messages to retrieve',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Source to retrieve messages from (redis or postgres)',
    example: 'redis',
    enum: ['redis', 'postgres'],
    default: 'redis',
  })
  @IsOptional()
  @IsString()
  source?: 'redis' | 'postgres';
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Message ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Platform-specific message identifier',
    example: 'msg_123456789',
  })
  messageId: string;

  @ApiProperty({
    description: 'Session identifier',
    example: 'session_123456789',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Sender type',
    enum: SenderType,
    example: SenderType.CUSTOMER,
  })
  senderType: SenderType;

  @ApiProperty({
    description: 'Recipient type',
    enum: RecipientType,
    example: RecipientType.USER,
  })
  recipientType: RecipientType;

  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  customerId: string | null;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  userId: string | null;

  @ApiProperty({
    description: 'From me flag',
    example: false,
  })
  fromMe: boolean;

  @ApiProperty({
    description: 'System message flag',
    example: false,
  })
  system: boolean;

  @ApiProperty({
    description: 'Group message flag',
    example: false,
  })
  isGroup: boolean;

  @ApiPropertyOptional({
    description: 'Message content',
    example: 'Hello, how can I help you?',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Media URL',
    example: 'https://example.com/image.jpg',
  })
  media?: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  type: MessageType;

  @ApiProperty({
    description: 'Platform',
    enum: MessagePlatform,
    example: MessagePlatform.WHATSAPP,
  })
  platform: MessagePlatform;

  @ApiProperty({
    description: 'Message status',
    enum: MessageStatus,
    example: MessageStatus.SENT,
  })
  status: MessageStatus;

  @ApiPropertyOptional({
    description: 'Additional metadata (optional) - may contain platform response data',
    example: null,
    nullable: true,
  })
  metadata?: any;

  @ApiPropertyOptional({
    description: 'Reply message ID',
    example: 'msg_123456789',
  })
  replyMessageId?: string;

  @ApiProperty({
    description: 'Sent timestamp',
    example: '2024-01-01T10:00:00.000Z',
  })
  sentAt: Date;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2024-01-01T10:00:00.000Z',
  })
  updatedAt: Date;

  // Computed properties
  @ApiProperty({
    description: 'Is text message',
    example: true,
  })
  isText: boolean;

  @ApiProperty({
    description: 'Is media message',
    example: false,
  })
  isMedia: boolean;

  @ApiProperty({
    description: 'Is from customer',
    example: true,
  })
  isFromCustomer: boolean;

  @ApiProperty({
    description: 'Is group message',
    example: false,
  })
  isGroupMessage: boolean;

  @ApiProperty({
    description: 'Has reply',
    example: false,
  })
  hasReply: boolean;

  @ApiProperty({
    description: 'Has media',
    example: false,
  })
  hasMedia: boolean;
}

export class PaginatedMessagesResponseDto {
  @ApiProperty({
    description: 'Array of messages',
    type: [MessageResponseDto],
  })
  data: MessageResponseDto[];

  @ApiProperty({
    description: 'Total number of messages',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of messages per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;
}

export class SessionMessagesResponseDto {
  @ApiProperty({
    description: 'Session identifier',
    example: 'session_123456789',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Array of messages',
    type: [MessageResponseDto],
  })
  messages: MessageResponseDto[];

  @ApiProperty({
    description: 'Number of messages',
    example: 25,
  })
  count: number;

  @ApiProperty({
    description: 'Data source',
    example: 'redis',
  })
  source: string;
}
