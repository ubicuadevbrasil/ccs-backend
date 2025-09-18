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
import { MessageType, MessagePlatform, MessageStatus } from '../entities/message.entity';

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
    description: 'Sender ID (user or customer)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  senderId: string;

  @ApiProperty({
    description: 'Recipient ID (user or customer)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  recipientId: string;

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
    description: 'Filter by sender ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  senderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by recipient ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  recipientId?: string;

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
    description: 'Sender ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  senderId: string;

  @ApiProperty({
    description: 'Recipient ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  recipientId: string;

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
    description: 'Additional metadata',
    example: { originalResponse: { id: '123' } },
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
