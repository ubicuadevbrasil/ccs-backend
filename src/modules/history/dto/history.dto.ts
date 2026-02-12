import { 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUUID, 
  IsDateString,
  MinLength, 
  MaxLength
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HistoryPlatform, HistoryDirection } from '../entities/history.entity';

export class CreateHistoryDto {
  @ApiProperty({
    description: 'Session identifier for tracking interactions',
    example: 'session_123456789',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Friendly session identifier (e.g., 20251218175106819)',
    example: '20251218175106819',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  protocol?: string;

  @ApiPropertyOptional({
    description: 'User ID who handled the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Customer ID involved in the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Donor code for the interaction',
    example: 'DONOR123',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  donorCode?: string;

  @ApiPropertyOptional({
    description: 'Tabulation ID for categorizing the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  tabulationId?: string;

  @ApiPropertyOptional({
    description: 'Internal notes/observations about the interaction',
    example: 'Customer was very satisfied with the service',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;

  @ApiProperty({
    description: 'Platform where the interaction occurred',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
    default: HistoryPlatform.WHATSAPP,
  })
  @IsEnum(HistoryPlatform)
  platform: HistoryPlatform;

  @ApiProperty({
    description: 'Interaction direction',
    enum: HistoryDirection,
    example: HistoryDirection.INBOUND,
    default: HistoryDirection.INBOUND,
  })
  @IsEnum(HistoryDirection)
  direction: HistoryDirection;

  @ApiProperty({
    description: 'When the interaction started',
    example: '2024-01-01T10:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startedAt: string;

  @ApiPropertyOptional({
    description: 'When the customer was attended (nullable)',
    example: '2024-01-01T10:05:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  attendedAt?: string;

  @ApiPropertyOptional({
    description: 'When the interaction finished (nullable)',
    example: '2024-01-01T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  finishedAt?: string;
}

export class UpdateHistoryDto {
  @ApiPropertyOptional({
    description: 'Session identifier for tracking interactions',
    example: 'session_123456789',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'User ID who handled the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Customer ID involved in the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Donor code for the interaction',
    example: 'DONOR123',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  donorCode?: string;

  @ApiPropertyOptional({
    description: 'Friendly session identifier (e.g., 20251218175106819)',
    example: '20251218175106819',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  protocol?: string;

  @ApiPropertyOptional({
    description: 'Internal notes/observations about the interaction',
    example: 'Customer was very satisfied with the service',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;

  @ApiPropertyOptional({
    description: 'Platform where the interaction occurred',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(HistoryPlatform)
  platform?: HistoryPlatform;

  @ApiPropertyOptional({
    description: 'Interaction direction',
    enum: HistoryDirection,
    example: HistoryDirection.INBOUND,
  })
  @IsOptional()
  @IsEnum(HistoryDirection)
  direction?: HistoryDirection;

  @ApiPropertyOptional({
    description: 'When the interaction started',
    example: '2024-01-01T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({
    description: 'When the customer was attended (nullable)',
    example: '2024-01-01T10:05:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  attendedAt?: string;

  @ApiPropertyOptional({
    description: 'When the interaction finished (nullable)',
    example: '2024-01-01T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  finishedAt?: string;
}

export class HistoryResponseDto {
  @ApiProperty({
    description: 'History unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Session identifier',
    example: 'session_123456789',
  })
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Friendly session identifier (e.g., 20251218175106819)',
    example: '20251218175106819',
  })
  protocol?: string;

  @ApiPropertyOptional({
    description: 'User ID who handled the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Customer ID involved in the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Donor code for the interaction',
    example: 'DONOR123',
  })
  donorCode?: string;

  @ApiPropertyOptional({
    description: 'Internal notes/observations',
    example: 'Customer was very satisfied with the service',
  })
  observations?: string;

  @ApiProperty({
    description: 'Platform where the interaction occurred',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  platform: HistoryPlatform;

  @ApiProperty({
    description: 'Interaction direction',
    enum: HistoryDirection,
    example: HistoryDirection.INBOUND,
  })
  direction: HistoryDirection;

  @ApiProperty({
    description: 'When the interaction started',
    example: '2024-01-01T10:00:00.000Z',
  })
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'When the customer was attended',
    example: '2024-01-01T10:05:00.000Z',
  })
  attendedAt?: Date;

  @ApiPropertyOptional({
    description: 'When the interaction finished',
    example: '2024-01-01T10:30:00.000Z',
  })
  finishedAt?: Date;

  @ApiProperty({
    description: 'History creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'History last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether interaction is still active',
    example: false,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether customer was attended',
    example: true,
  })
  isAttended: boolean;

  @ApiProperty({
    description: 'Whether interaction is finished',
    example: true,
  })
  isFinished: boolean;

  @ApiPropertyOptional({
    description: 'Total duration in milliseconds',
    example: 1800000,
  })
  duration?: number;

  @ApiPropertyOptional({
    description: 'Time to attend customer in milliseconds',
    example: 300000,
  })
  attendanceTime?: number;

  @ApiProperty({
    description: 'Whether interaction has observations',
    example: true,
  })
  hasObservations: boolean;

  @ApiProperty({
    description: 'Whether platform is WhatsApp',
    example: true,
  })
  isWhatsApp: boolean;

  @ApiProperty({
    description: 'Whether platform is Telegram',
    example: false,
  })
  isTelegram: boolean;

  @ApiProperty({
    description: 'Whether platform is Instagram',
    example: false,
  })
  isInstagram: boolean;

  @ApiProperty({
    description: 'Whether platform is Facebook',
    example: false,
  })
  isFacebook: boolean;
}

export class HistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Search term for sessionId or observations',
    example: 'session_123',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by protocol',
    example: '20251218175106819',
  })
  @IsOptional()
  @IsString()
  protocol?: string;

  @ApiPropertyOptional({
    description: 'Filter by platform',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(HistoryPlatform)
  platform?: HistoryPlatform;

  @ApiPropertyOptional({
    description: 'Filter by start date (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO string)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by active interactions only',
    example: true,
  })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiPropertyOptional({
    description: 'Filter by attended interactions only',
    example: true,
  })
  @IsOptional()
  @IsString()
  isAttended?: string;

  @ApiPropertyOptional({
    description: 'Filter by finished interactions only',
    example: true,
  })
  @IsOptional()
  @IsString()
  isFinished?: string;

  @ApiPropertyOptional({
    description: 'Filter by direction',
    enum: HistoryDirection,
    example: HistoryDirection.INBOUND,
  })
  @IsOptional()
  @IsEnum(HistoryDirection)
  direction?: HistoryDirection;
}

export class FindHistoryDto {
  @ApiProperty({
    description: 'History unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class UpdateHistoryByIdDto {
  @ApiProperty({
    description: 'History unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    description: 'Session identifier for tracking interactions',
    example: 'session_123456789',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'User ID who handled the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Customer ID involved in the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Donor code for the interaction',
    example: 'DONOR123',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  donorCode?: string;

  @ApiPropertyOptional({
    description: 'Friendly session identifier (e.g., 20251218175106819)',
    example: '20251218175106819',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  protocol?: string;

  @ApiPropertyOptional({
    description: 'Internal notes/observations about the interaction',
    example: 'Customer was very satisfied with the service',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;

  @ApiPropertyOptional({
    description: 'Platform where the interaction occurred',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(HistoryPlatform)
  platform?: HistoryPlatform;

  @ApiPropertyOptional({
    description: 'Interaction direction',
    enum: HistoryDirection,
    example: HistoryDirection.INBOUND,
  })
  @IsOptional()
  @IsEnum(HistoryDirection)
  direction?: HistoryDirection;

  @ApiPropertyOptional({
    description: 'When the interaction started',
    example: '2024-01-01T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({
    description: 'When the customer was attended (nullable)',
    example: '2024-01-01T10:05:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  attendedAt?: string;

  @ApiPropertyOptional({
    description: 'When the interaction finished (nullable)',
    example: '2024-01-01T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  finishedAt?: string;
}

export class DeleteHistoryDto {
  @ApiProperty({
    description: 'History unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class HistoryListCustomerDto {
  @ApiPropertyOptional({
    description: 'Customer unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id?: string;

  @ApiPropertyOptional({
    description: 'Platform-specific ID (WhatsApp phone, Telegram user_id, etc.)',
    example: '5511999999999',
  })
  platformId?: string;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'John Doe',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Customer email',
    example: 'john.doe@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Customer CPF',
    example: '12345678901',
  })
  cpf?: string;

  @ApiPropertyOptional({
    description: 'Customer profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  profilePicture?: string;

  @ApiPropertyOptional({
    description: 'Customer donor code',
    example: 'DONOR123',
  })
  donorCode?: string;

  @ApiPropertyOptional({
    description: 'Customer observations',
    example: 'VIP customer',
  })
  observations?: string;

  @ApiPropertyOptional({
    description: 'Customer tags',
    example: ['vip', 'premium'],
    type: [String],
  })
  tags?: string[];
}

export class HistoryListUserDto {
  @ApiPropertyOptional({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id?: string;

  @ApiPropertyOptional({
    description: 'User name',
    example: 'Jane Smith',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'User profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  profilePicture?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'jane.smith@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'User contact information',
    example: '+1234567890',
  })
  contact?: string;
}

export class HistoryListTabulationDto {
  @ApiPropertyOptional({
    description: 'Tabulation unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id?: string;

  @ApiPropertyOptional({
    description: 'Tabulation name',
    example: 'Main Tabulation',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Tabulation description',
    example: 'Description for main tabulation',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether tabulation is effective',
    example: false,
  })
  effective?: boolean;
}

export class HistoryListItemDto {
  @ApiProperty({
    description: 'History unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Session identifier',
    example: 'session_123456789',
  })
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Friendly session identifier',
    example: '20251218175106819',
  })
  protocol?: string;

  @ApiProperty({
    description: 'Platform where the interaction occurred',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  platform: HistoryPlatform;

  @ApiProperty({
    description: 'Interaction direction',
    enum: HistoryDirection,
    example: HistoryDirection.INBOUND,
  })
  direction: HistoryDirection;

  @ApiPropertyOptional({
    description: 'Donor code for the interaction',
    example: 'DONOR123',
  })
  donorCode?: string;

  @ApiPropertyOptional({
    description: 'Internal notes/observations',
    example: 'Customer was very satisfied with the service',
  })
  observations?: string;

  @ApiProperty({
    description: 'When the interaction started',
    example: '2024-01-01T10:00:00.000Z',
  })
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'When the customer was attended',
    example: '2024-01-01T10:05:00.000Z',
  })
  attendedAt?: Date;

  @ApiPropertyOptional({
    description: 'When the interaction finished',
    example: '2024-01-01T10:30:00.000Z',
  })
  finishedAt?: Date;

  @ApiPropertyOptional({
    description: 'Customer information',
    type: HistoryListCustomerDto,
  })
  customer?: HistoryListCustomerDto;

  @ApiPropertyOptional({
    description: 'User information',
    type: HistoryListUserDto,
  })
  user?: HistoryListUserDto;

  @ApiPropertyOptional({
    description: 'Tabulation information',
    type: HistoryListTabulationDto,
  })
  tabulation?: HistoryListTabulationDto;
}

export class HistoryListResponseDto {
  @ApiProperty({
    description: 'List of history records',
    type: [HistoryListItemDto],
  })
  data: HistoryListItemDto[];

  @ApiProperty({
    description: 'Total number of records',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;
}

export class HistoryWithMessagesDto {
  @ApiProperty({
    description: 'History unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Session identifier',
    example: 'session_123456789',
  })
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Friendly session identifier',
    example: '20251218175106819',
  })
  protocol?: string;

  @ApiProperty({
    description: 'Platform where the interaction occurred',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  platform: HistoryPlatform;

  @ApiProperty({
    description: 'Interaction direction',
    enum: HistoryDirection,
    example: HistoryDirection.INBOUND,
  })
  direction: HistoryDirection;

  @ApiPropertyOptional({
    description: 'Internal notes/observations',
    example: 'Customer was very satisfied with the service',
  })
  observations?: string;

  @ApiProperty({
    description: 'When the interaction started',
    example: '2024-01-01T10:00:00.000Z',
  })
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'When the customer was attended',
    example: '2024-01-01T10:05:00.000Z',
  })
  attendedAt?: Date;

  @ApiPropertyOptional({
    description: 'When the interaction finished',
    example: '2024-01-01T10:30:00.000Z',
  })
  finishedAt?: Date;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'John Doe',
  })
  customerName?: string;

  @ApiPropertyOptional({
    description: 'User name',
    example: 'Jane Smith',
  })
  userName?: string;

  @ApiProperty({
    description: 'Messages for this session from PostgreSQL, ordered by sentAt ascending (oldest first). Each message contains: id, messageId, sessionId, senderType, recipientType, customerId, userId, fromMe, system, isGroup, message, media, type, platform, status, metadata, replyMessageId, sentAt, createdAt, updatedAt',
    type: 'array',
    items: { 
      type: 'object',
      properties: {
        id: { type: 'string' },
        messageId: { type: 'string' },
        sessionId: { type: 'string' },
        senderType: { type: 'string', enum: ['system', 'bot', 'customer', 'user'] },
        recipientType: { type: 'string', enum: ['system', 'bot', 'customer', 'user'] },
        customerId: { type: 'string', nullable: true },
        userId: { type: 'string', nullable: true },
        fromMe: { type: 'boolean' },
        system: { type: 'boolean' },
        isGroup: { type: 'boolean' },
        message: { type: 'string', nullable: true },
        media: { type: 'string', nullable: true },
        type: { type: 'string', enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'other'] },
        platform: { type: 'string', enum: ['whatsapp', 'chatweb', 'telegram', 'instagram', 'facebook', 'other'] },
        status: { type: 'string', enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'deleted'] },
        metadata: { type: 'object', nullable: true },
        replyMessageId: { type: 'string', nullable: true },
        sentAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      }
    },
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        messageId: 'msg_123456789',
        sessionId: 'session_123456789',
        senderType: 'customer',
        recipientType: 'user',
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        userId: null,
        fromMe: false,
        system: false,
        isGroup: false,
        message: 'Hello, I need help',
        media: null,
        type: 'text',
        platform: 'whatsapp',
        status: 'delivered',
        metadata: null,
        replyMessageId: null,
        sentAt: '2024-01-01T10:00:00.000Z',
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z',
      }
    ],
  })
  messages: any[];
}
