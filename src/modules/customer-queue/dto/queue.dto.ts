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
import { HistoryPlatform } from '../../history/entities/history.entity';
import { QueueStatus } from '../entities/queue.entity';

export class CreateQueueDto {
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

  @ApiProperty({
    description: 'Customer ID involved in the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'User ID who will handle the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Platform where the interaction occurred',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  @IsEnum(HistoryPlatform)
  platform: HistoryPlatform;

  @ApiProperty({
    description: 'Current status of the queue item',
    enum: QueueStatus,
    example: QueueStatus.BOT,
    default: QueueStatus.BOT,
  })
  @IsEnum(QueueStatus)
  status: QueueStatus;

  @ApiPropertyOptional({
    description: 'When the customer was attended (nullable)',
    example: '2024-01-01T10:05:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  attendedAt?: string;
}

export class UpdateQueueDto {
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
    description: 'Customer ID involved in the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'User ID who will handle the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Platform where the interaction occurred',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(HistoryPlatform)
  platform?: HistoryPlatform;

  @ApiPropertyOptional({
    description: 'Current status of the queue item',
    enum: QueueStatus,
    example: QueueStatus.WAITING,
  })
  @IsOptional()
  @IsEnum(QueueStatus)
  status?: QueueStatus;

  @ApiPropertyOptional({
    description: 'When the customer was attended (nullable)',
    example: '2024-01-01T10:05:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  attendedAt?: string;
}

export class QueueResponseDto {
  @ApiProperty({
    description: 'Session identifier',
    example: 'session_123456789',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Customer ID involved in the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  customerId: string;

  @ApiProperty({
    description: 'User ID who will handle the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Platform where the interaction occurred',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  platform: HistoryPlatform;

  @ApiProperty({
    description: 'Current status of the queue item',
    enum: QueueStatus,
    example: QueueStatus.WAITING,
  })
  status: QueueStatus;

  @ApiProperty({
    description: 'Queue creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'When the customer was attended',
    example: '2024-01-01T10:05:00.000Z',
  })
  attendedAt?: Date;

  @ApiProperty({
    description: 'Whether status is bot',
    example: false,
  })
  isBot: boolean;

  @ApiProperty({
    description: 'Whether status is waiting',
    example: true,
  })
  isWaiting: boolean;

  @ApiProperty({
    description: 'Whether status is in service',
    example: false,
  })
  isInService: boolean;

  @ApiProperty({
    description: 'Whether customer was attended',
    example: true,
  })
  isAttended: boolean;

  @ApiPropertyOptional({
    description: 'Waiting time in milliseconds',
    example: 300000,
  })
  waitingTime?: number;

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

export class QueueQueryDto {
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
    description: 'Search term for sessionId',
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
    description: 'Filter by platform',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(HistoryPlatform)
  platform?: HistoryPlatform;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: QueueStatus,
    example: QueueStatus.WAITING,
  })
  @IsOptional()
  @IsEnum(QueueStatus)
  status?: QueueStatus;

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
}

export class FindQueueDto {
  @ApiProperty({
    description: 'Session identifier',
    example: 'session_123456789',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class EndServiceDto {
  @ApiProperty({
    description: 'Session identifier',
    example: 'session_123456789',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

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
    description: 'Tabulation ID used in the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  tabulationId?: string;
}
