import { Socket } from 'socket.io';
import { MessageFrom, MessageDirection, MessageStatus } from '../../messages/interfaces/message.interface';
import { QueueStatus, Department } from '../../queues/interfaces/queue.interface';

export interface OperatorConnection {
  socketId: string;
  operatorId: string;
  operatorName: string;
  department: Department;
  isAvailable: boolean;
  currentQueueId?: string;
  connectedAt: Date;
  lastActivity: Date;
}

export interface SocketMessage {
  id: string;
  sessionId: string;
  content: string;
  from: MessageFrom;
  direction: MessageDirection;
  status: MessageStatus;
  senderId?: string;
  senderName?: string;
  senderPhone?: string;
  messageType: string;
  mediaUrl?: string;
  timestamp: Date;
  evolutionData?: Record<string, any>;
}

export interface QueueUpdate {
  id: string;
  sessionId: string;
  customerPhone: string;
  customerName?: string;
  status: QueueStatus;
  department: Department;
  assignedOperatorId?: string;
  operatorName?: string;
  createdAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
}

export interface WebhookEvent {
  event: string;
  instance: string;
  data: any;
  timestamp: Date;
}

export interface SocketEvent {
  type: string;
  data: SocketMessage | QueueUpdate | WebhookEvent | any;
  target?: string | string[]; // operatorId(s) or 'all'
  room?: string;
}

export interface OperatorStatusUpdate {
  operatorId: string;
  isAvailable: boolean;
  currentQueueId?: string;
  department: Department;
}

export interface SystemNotification {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  title?: string;
  data?: any;
}

export interface SocketRoom {
  name: string;
  type: 'operator' | 'department' | 'queue' | 'system';
  members: string[];
  metadata?: Record<string, any>;
}

export interface SocketConnection {
  socket: Socket;
  operatorId?: string;
  department?: Department;
  rooms: string[];
  metadata?: Record<string, any>;
} 