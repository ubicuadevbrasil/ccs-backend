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
import { MessageType, MessagePlatform, SenderType, RecipientType } from '../../messages/entities/message.entity';
import { WhatsAppMessageExamples } from './whatsapp-examples';

export class SendMessageDto {
  @ApiProperty({
    description: 'Session identifier for grouping related messages. All customer data will be retrieved from the queue using this session ID.',
    example: 'session_whatsapp_123456789',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Message text content. Either message or media must be provided.',
    example: 'Hello, how can I help you?',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @ApiPropertyOptional({
    description: 'Media URL for images, videos, audio, documents, or stickers. Either message or media must be provided.',
    example: 'https://example.com/image.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  media?: string;

  @ApiPropertyOptional({
    description: 'Type of message being sent. Will be auto-detected from media URL if not provided.',
    enum: MessageType,
    example: MessageType.TEXT,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({
    description: 'Whether the message is being sent to a group. Will be retrieved from customer data if not provided.',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({
    description: 'ID of the message being replied to',
    example: 'msg_123456789',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  replyMessageId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the message (optional). Will be merged with customer data from queue if provided.',
    example: {
      customField: 'customValue',
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SendMessageResponseDto {
  @ApiProperty({
    description: 'Message ID in PostgreSQL',
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
    example: SenderType.USER,
  })
  senderType: SenderType;

  @ApiProperty({
    description: 'Recipient type',
    enum: RecipientType,
    example: RecipientType.CUSTOMER,
  })
  recipientType: RecipientType;

  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  customerId: string;

  @ApiProperty({
    description: 'User ID who sent the message',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'From me flag',
    example: true,
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
    example: 'pending',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { customData: 'value' },
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
}
