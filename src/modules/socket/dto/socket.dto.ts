import { IsString, IsEnum, IsOptional, IsBoolean, IsDateString, IsObject } from 'class-validator';
import { Department } from '../../queues/interfaces/queue.interface';
import { MessageFrom, MessageDirection, MessageStatus } from '../../messages/interfaces/message.interface';
import { ApiProperty } from '@nestjs/swagger';

export class GetOperatorsQueryDto {
  @ApiProperty({ 
    description: 'Filter operators by department',
    enum: Department,
    required: false,
    example: Department.PERSONAL
  })
  @IsOptional()
  @IsEnum(Department)
  department?: Department;
}

export interface AuthenticatedUser {
  id: string;
  login: string;
  name: string;
  email: string;
  profile: string;
  department: string;
}

export class OperatorAuthDto {
  @IsString()
  operatorId: string;

  @IsString()
  operatorName: string;

  @IsEnum(Department)
  department: Department;

  @IsString()
  @IsOptional()
  token?: string;
}

export class UpdateStatusDto {
  @IsString()
  @IsOptional()
  currentQueueId?: string;
}

export class JoinQueueDto {
  @IsString()
  queueId: string;
}

export class SendMessageDto {
  @IsString()
  sessionId: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  messageType?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;
}

export class SystemNotificationDto {
  @IsEnum(['info', 'warning', 'error', 'success'])
  type: 'info' | 'warning' | 'error' | 'success';

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsObject()
  @IsOptional()
  data?: any;
}

export class WebhookEventDto {
  @IsString()
  event: string;

  @IsString()
  instance: string;

  @IsObject()
  data: any;

  @IsDateString()
  @IsOptional()
  timestamp?: string;
}

export class SocketMessageDto {
  @IsString()
  id: string;

  @IsString()
  sessionId: string;

  @IsString()
  content: string;

  @IsEnum(MessageFrom)
  from: MessageFrom;

  @IsEnum(MessageDirection)
  direction: MessageDirection;

  @IsEnum(MessageStatus)
  status: MessageStatus;

  @IsString()
  @IsOptional()
  senderId?: string;

  @IsString()
  @IsOptional()
  senderName?: string;

  @IsString()
  @IsOptional()
  senderPhone?: string;

  @IsString()
  messageType: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsDateString()
  timestamp: string;

  @IsObject()
  @IsOptional()
  evolutionData?: Record<string, any>;
}

export class QueueUpdateDto {
  @IsString()
  id: string;

  @IsString()
  sessionId: string;

  @IsString()
  customerPhone: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  status: string;

  @IsEnum(Department)
  department: Department;

  @IsString()
  @IsOptional()
  assignedOperatorId?: string;

  @IsString()
  @IsOptional()
  operatorName?: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  @IsOptional()
  assignedAt?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}

export class OperatorStatusUpdateDto {
  @IsString()
  operatorId: string;

  @IsBoolean()
  isAvailable: boolean;

  @IsString()
  @IsOptional()
  currentQueueId?: string;

  @IsEnum(Department)
  department: Department;
}

export class SocketEventDto {
  @IsEnum(['message', 'queue_update', 'webhook_event', 'operator_status', 'system_notification'])
  type: 'message' | 'queue_update' | 'webhook_event' | 'operator_status' | 'system_notification';

  @IsObject()
  data: SocketMessageDto | QueueUpdateDto | WebhookEventDto | OperatorStatusUpdateDto | SystemNotificationDto;

  @IsString()
  @IsOptional()
  target?: string;

  @IsString()
  @IsOptional()
  room?: string;
} 

export class DisconnectUserDto {
  @ApiProperty({ 
    description: 'User ID to disconnect',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  userId: string;

  @ApiProperty({ 
    description: 'Reason for disconnection',
    required: false,
    example: 'Session timeout'
  })
  @IsOptional()
  @IsString()
  reason?: string;
} 