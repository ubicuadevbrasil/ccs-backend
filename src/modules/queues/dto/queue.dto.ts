import { ApiProperty } from '@nestjs/swagger';
import { QueueStatus, Department, QueueDirection } from '../interfaces/queue.interface';
import { IsString } from 'class-validator';

export class QueueResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the queue',
    example: 'queue-123',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'Session identifier from the typebot system',
    example: 'session-456',
    type: 'string'
  })
  sessionId: string;

  @ApiProperty({ 
    description: 'Customer identifier associated with this queue',
    example: 'customer-789',
    type: 'string'
  })
  customerId: string;

  @ApiProperty({ 
    description: 'Current status of the queue',
    enum: QueueStatus,
    example: QueueStatus.WAITING
  })
  status: QueueStatus;

  @ApiProperty({ 
    description: 'Department handling this queue',
    enum: Department,
    example: Department.PERSONAL
  })
  department: Department;

  @ApiProperty({ 
    description: 'Direction of the queue: inbound (customer initiated) or outbound (operator initiated)',
    enum: QueueDirection,
    example: QueueDirection.INBOUND
  })
  direction: QueueDirection;

  @ApiProperty({ 
    description: 'ID of the operator specifically requested by the customer',
    example: 'operator-123',
    required: false,
    nullable: true
  })
  requestedOperatorId?: string;

  @ApiProperty({ 
    description: 'ID of the operator currently assigned to this queue',
    example: 'operator-456',
    required: false,
    nullable: true
  })
  assignedOperatorId?: string;

  @ApiProperty({ 
    description: 'ID of the supervisor overseeing this queue',
    example: 'supervisor-789',
    required: false,
    nullable: true
  })
  supervisorId?: string;

  @ApiProperty({ 
    description: 'Data collected from the typebot session',
    example: { 
      customerName: 'John Doe',
      issueType: 'billing',
      priority: 'high'
    }
  })
  typebotData: Record<string, any>;

  @ApiProperty({ 
    description: 'Department chosen by the customer during typebot interaction',
    example: 'Personal',
    required: false,
    nullable: true
  })
  customerDepartmentChoice?: string;

  @ApiProperty({ 
    description: 'Specific operator chosen by the customer',
    example: 'operator-123',
    required: false,
    nullable: true
  })
  customerOperatorChoice?: string;

  @ApiProperty({ 
    description: 'Whether an operator is available to handle this queue',
    example: true,
    type: 'boolean'
  })
  operatorAvailable: boolean;

  @ApiProperty({ 
    description: 'Timestamp when the queue was created',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time'
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Timestamp when the typebot session was completed',
    example: '2024-01-15T10:35:00Z',
    required: false,
    nullable: true,
    type: 'string',
    format: 'date-time'
  })
  typebotCompletedAt?: Date;

  @ApiProperty({ 
    description: 'Timestamp when an operator was assigned to this queue',
    example: '2024-01-15T10:40:00Z',
    required: false,
    nullable: true,
    type: 'string',
    format: 'date-time'
  })
  assignedAt?: Date;

  @ApiProperty({ 
    description: 'Timestamp when the queue was completed',
    example: '2024-01-15T11:00:00Z',
    required: false,
    nullable: true,
    type: 'string',
    format: 'date-time'
  })
  completedAt?: Date;

  @ApiProperty({ 
    description: 'Evolution API instance identifier',
    example: 'instance-1',
    required: false,
    nullable: true
  })
  evolutionInstance?: string;

  @ApiProperty({ 
    description: 'URL to the typebot session',
    example: 'https://typebot.io/session/123',
    required: false,
    nullable: true
  })
  typebotSessionUrl?: string;

  @ApiProperty({ 
    description: 'Additional metadata associated with the queue',
    example: { 
      source: 'whatsapp',
      channel: 'web',
      tags: ['urgent', 'vip']
    }
  })
  metadata: Record<string, any>;
}

export class CustomerResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the customer',
    example: 'customer-789',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'WhatsApp phone number in JID format',
    example: '5511999999999@s.whatsapp.net',
    type: 'string'
  })
  remoteJid: string;

  @ApiProperty({ 
    description: 'Display name from WhatsApp',
    example: 'John Doe',
    required: false,
    nullable: true
  })
  pushName?: string;

  @ApiProperty({ 
    description: 'URL to the customer\'s profile picture',
    example: 'https://example.com/profile.jpg',
    required: false,
    nullable: true
  })
  profilePicUrl?: string;

  @ApiProperty({ 
    description: 'Customer\'s email address',
    example: 'john@example.com',
    required: false,
    nullable: true
  })
  email?: string;

  @ApiProperty({ 
    description: 'Brazilian individual tax ID (CPF)',
    example: '12345678901',
    required: false,
    nullable: true
  })
  cpf?: string;

  @ApiProperty({ 
    description: 'Brazilian company tax ID (CNPJ)',
    example: '12345678000199',
    required: false,
    nullable: true
  })
  cnpj?: string;

  @ApiProperty({ 
    description: 'Customer priority level (higher number = higher priority)',
    example: 1,
    type: 'number'
  })
  priority: number;

  @ApiProperty({ 
    description: 'Whether this is a group chat',
    example: false,
    type: 'boolean'
  })
  isGroup: boolean;

  @ApiProperty({ 
    description: 'Whether this contact is saved in the phone',
    example: true,
    type: 'boolean'
  })
  isSaved: boolean;

  @ApiProperty({ 
    description: 'Type of contact (contact, group, etc.)',
    example: 'contact',
    type: 'string'
  })
  type: string;

  @ApiProperty({ 
    description: 'Current status of the contact',
    example: 'active',
    type: 'string'
  })
  status: string;

  @ApiProperty({ 
    description: 'Timestamp when the customer was created',
    example: '2024-01-15T10:25:00Z',
    type: 'string',
    format: 'date-time'
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Timestamp when the customer was last updated',
    example: '2024-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time'
  })
  updatedAt: Date;
}

export class QueueWithCustomerResponseDto extends QueueResponseDto {
  @ApiProperty({ description: 'Customer information', type: CustomerResponseDto })
  customer: CustomerResponseDto;
}

export class TransferQueueDto {
  @IsString()
  @ApiProperty({
    description: 'ID of the target operator to transfer the queue to',
    example: 'operator-123'
  })
  operatorId: string;
} 

export class CompleteQueueServiceDto {
  @ApiProperty({ 
    description: 'Tabulation status sub category ID for this service completion',
    example: 'tab-status-sub-123',
    type: 'string'
  })
  @IsString()
  tabulationStatusSubId: string;
}

export class ConversationHistoryMessageDto {
  @ApiProperty({ 
    description: 'Message ID',
    example: 'msg-123',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'Session ID this message belongs to',
    example: 'session-456',
    type: 'string'
  })
  sessionId: string;

  @ApiProperty({ 
    description: 'Message content',
    example: 'Hello, I need help with my account',
    type: 'string'
  })
  content?: string;

  @ApiProperty({ 
    description: 'Message source',
    example: 'Customer',
    type: 'string'
  })
  from: string;

  @ApiProperty({ 
    description: 'Message direction',
    example: 'inbound',
    type: 'string'
  })
  direction: string;

  @ApiProperty({ 
    description: 'Message status',
    example: 'sent',
    type: 'string'
  })
  status: string;

  @ApiProperty({ 
    description: 'Message type',
    example: 'conversation',
    type: 'string'
  })
  messageType: string;

  @ApiProperty({ 
    description: 'Media URL if message contains media',
    example: 'https://example.com/image.jpg',
    required: false,
    nullable: true
  })
  mediaUrl?: string;

  @ApiProperty({ 
    description: 'Message timestamp',
    example: '2024-01-15T10:30:00Z',
    type: 'string'
  })
  sentAt: string;

  @ApiProperty({ 
    description: 'Whether message is from the system/operator',
    example: false,
    type: 'boolean'
  })
  fromMe: boolean;

  @ApiProperty({ 
    description: 'Sender name',
    example: 'John Doe',
    required: false,
    nullable: true
  })
  senderName?: string;

  @ApiProperty({ 
    description: 'Sender phone number',
    example: '5511999999999',
    required: false,
    nullable: true
  })
  senderPhone?: string;
}

export class ConversationHistoryUserDto {
  @ApiProperty({ 
    description: 'User ID',
    example: 'user-123',
    type: 'string'
  })
  id: string;

  @ApiProperty({ 
    description: 'User full name',
    example: 'João Silva',
    type: 'string'
  })
  name: string;

  @ApiProperty({ 
    description: 'User login/username',
    example: 'joao.silva',
    type: 'string'
  })
  login: string;

  @ApiProperty({ 
    description: 'User email address',
    example: 'joao.silva@unidas.com.br',
    type: 'string'
  })
  email: string;

  @ApiProperty({ 
    description: 'User department',
    example: 'Personal',
    type: 'string'
  })
  department: string;

  @ApiProperty({ 
    description: 'User profile',
    example: 'operator',
    type: 'string'
  })
  profile: string;

  @ApiProperty({ 
    description: 'User status',
    example: 'active',
    type: 'string'
  })
  status: string;
}

export class ConversationHistoryOperatorsDto {
  @ApiProperty({ 
    description: 'Requested operator information',
    type: ConversationHistoryUserDto,
    required: false
  })
  requestedOperator?: ConversationHistoryUserDto;

  @ApiProperty({ 
    description: 'Assigned operator information',
    type: ConversationHistoryUserDto,
    required: false
  })
  assignedOperator?: ConversationHistoryUserDto;

  @ApiProperty({ 
    description: 'Supervisor information',
    type: ConversationHistoryUserDto,
    required: false
  })
  supervisor?: ConversationHistoryUserDto;
}

export class ConversationHistoryItemDto {
  @ApiProperty({ 
    description: 'Queue information with customer details',
    type: QueueWithCustomerResponseDto
  })
  queue: QueueWithCustomerResponseDto;

  @ApiProperty({ 
    description: 'Messages for this queue session (included only when messages flag is true)',
    type: [ConversationHistoryMessageDto],
    required: false
  })
  messages?: ConversationHistoryMessageDto[];

  @ApiProperty({ 
    description: 'Operator information for this queue session',
    required: false
  })
  operators?: ConversationHistoryOperatorsDto;
} 