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
import { HistoryPlatform } from '../entities/history.entity';

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
    description: 'Tabulation ID used in the interaction',
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
    description: 'Tabulation ID used in the interaction',
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

  @ApiPropertyOptional({
    description: 'Platform where the interaction occurred',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(HistoryPlatform)
  platform?: HistoryPlatform;

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
    description: 'Tabulation ID used in the interaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tabulationId?: string;

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
    description: 'Filter by tabulation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  tabulationId?: string;

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
    description: 'Tabulation ID used in the interaction',
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

  @ApiPropertyOptional({
    description: 'Platform where the interaction occurred',
    enum: HistoryPlatform,
    example: HistoryPlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(HistoryPlatform)
  platform?: HistoryPlatform;

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
