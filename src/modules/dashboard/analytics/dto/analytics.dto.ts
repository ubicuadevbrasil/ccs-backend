import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum HistoryDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export class CardsMetricsResponseDto {
  @ApiProperty({
    description: 'Number of customers waiting in queue',
    example: 5,
  })
  customersWaitingInQueue: number;

  @ApiProperty({
    description: 'Number of customers in service',
    example: 12,
  })
  customersInService: number;

  @ApiProperty({
    description: 'Number of finished services today',
    example: 45,
  })
  finishedServices: number;

  @ApiProperty({
    description: 'Number of received messages today',
    example: 234,
  })
  receivedMessages: number;

  @ApiProperty({
    description: 'Number of sent messages today',
    example: 198,
  })
  sentMessages: number;

  @ApiProperty({
    description: 'Number of read messages today',
    example: 156,
  })
  readMessages: number;

  @ApiProperty({
    description: 'Total messages (received + sent) today',
    example: 432,
  })
  total: number;

  @ApiPropertyOptional({
    description: 'Average waiting queue time in seconds (from Redis: attended entries)',
    example: 125.5,
    nullable: true,
  })
  avgWaitingQueueTimeSeconds: number | null;

  @ApiPropertyOptional({
    description: 'Average service time in seconds (from Redis: entries currently in service)',
    example: 342.8,
    nullable: true,
  })
  avgServiceTimeSeconds: number | null;
}

export class OperatorResponseDto {
  @ApiProperty({
    description: 'Whether the user is currently connected via socket',
    example: true,
  })
  isConnected: boolean;

  @ApiProperty({
    description: 'Socket ID',
    example: 'socket_abc123',
  })
  socketId: string;

  @ApiProperty({
    description: 'Socket online time in milliseconds',
    example: 3600000,
  })
  socketOnlineTime: number;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'User profile/role',
    example: 'operator',
    enum: ['admin', 'supervisor', 'operator'],
  })
  userProfile: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  userName: string;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  userEmail: string;

  @ApiProperty({
    description: 'User contact',
    example: '+1234567890',
  })
  userContact: string;

  @ApiProperty({
    description: 'User avatar/profile picture',
    example: 'https://example.com/avatar.jpg',
  })
  userAvatar: string;

  @ApiProperty({
    description: 'User last login timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  userLoginAt: Date | null;

  @ApiProperty({
    description: 'User last logout timestamp',
    example: '2024-01-15T18:00:00Z',
  })
  userLogoutAt: Date | null;

  @ApiProperty({
    description: 'User last activity timestamp',
    example: '2024-01-15T17:45:00Z',
  })
  userLastActivityAt: Date | null;

  @ApiProperty({
    description: 'Number of customers in service for this user today',
    example: 3,
  })
  customersInService: number;

  @ApiProperty({
    description: 'Number of finished services for this user today',
    example: 8,
  })
  finishedServices: number;
}

export class OperatorsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: string;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: string;

  @ApiPropertyOptional({
    description: 'Search term for user name, email, or contact',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class OperatorsResponseDto {
  @ApiProperty({
    description: 'Array of operators',
    type: [OperatorResponseDto],
  })
  data: OperatorResponseDto[];

  @ApiProperty({
    description: 'Total number of operators',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of operators per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;
}

export class ActiveServiceCustomerDto {
  @ApiPropertyOptional({
    description: 'Customer unique identifier',
    example: '3e9fdea3-f938-4167-9772-579265c896be',
  })
  id?: string;

  @ApiPropertyOptional({
    description: 'Platform-specific ID (WhatsApp phone, Telegram user_id, etc.)',
    example: '5511982740276',
  })
  platformId?: string;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'Odair Victoriano',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Customer email',
  })
  email?: string | null;

  @ApiPropertyOptional({
    description: 'Customer CPF',
  })
  cpf?: string | null;

  @ApiPropertyOptional({
    description: 'Customer profile picture URL',
  })
  profilePicture?: string | null;

  @ApiPropertyOptional({
    description: 'Customer donor code',
  })
  donorCode?: string | null;

  @ApiPropertyOptional({
    description: 'Customer observations',
  })
  observations?: string | null;

  @ApiPropertyOptional({
    description: 'Customer tags',
    type: [String],
    example: [],
  })
  tags?: string[];
}

export class ActiveServiceUserDto {
  @ApiPropertyOptional({
    description: 'User unique identifier',
    example: '48512c15-6497-11ee-8da1-ac1f6bf53052',
  })
  id?: string;

  @ApiPropertyOptional({
    description: 'User name',
    example: 'Ubicua Supervisor',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'User profile picture URL',
  })
  profilePicture?: string | null;

  @ApiPropertyOptional({
    description: 'User email',
    example: 'ubcsuper@ubicua.com',
  })
  email?: string | null;

  @ApiPropertyOptional({
    description: 'User contact',
    example: '+5511999999992',
  })
  contact?: string | null;
}

export class ActiveServiceResponseDto {
  @ApiProperty({
    description: 'Service protocol',
    example: '20251218175106819',
  })
  protocol: string | null;

  @ApiProperty({
    description: 'Session ID',
    example: 'session_123456789',
  })
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Customer information',
    type: ActiveServiceCustomerDto,
  })
  customer?: ActiveServiceCustomerDto | null;

  @ApiPropertyOptional({
    description: 'User (operator) information',
    type: ActiveServiceUserDto,
  })
  user?: ActiveServiceUserDto | null;

  @ApiProperty({
    description: 'Service direction',
    enum: HistoryDirection,
    example: HistoryDirection.INBOUND,
  })
  direction: HistoryDirection;

  @ApiProperty({
    description: 'When the queue entry was created (service started)',
    example: '2024-01-15T10:00:00Z',
  })
  startedAt: Date | null;

  @ApiProperty({
    description: 'When the service was attended',
    example: '2024-01-15T10:30:00Z',
  })
  attendedAt: Date | null;
}

export class ActiveServicesQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: string;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: string;

  @ApiPropertyOptional({
    description: 'Search term for protocol, customer name, or customer number',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by direction',
    enum: HistoryDirection,
    example: HistoryDirection.INBOUND,
  })
  @IsOptional()
  @IsEnum(HistoryDirection)
  direction?: HistoryDirection;
}

export class ActiveServicesResponseDto {
  @ApiProperty({
    description: 'Array of active services',
    type: [ActiveServiceResponseDto],
  })
  data: ActiveServiceResponseDto[];

  @ApiProperty({
    description: 'Total number of active services',
    example: 15,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of services per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 2,
  })
  totalPages: number;
}

