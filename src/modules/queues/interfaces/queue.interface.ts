import { UserDepartment } from "src/modules/users/interfaces/user.interface";

export enum QueueStatus {
  TYPEBOT = 'typebot',
  WAITING = 'waiting',
  SERVICE = 'service',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum Department {
  PERSONAL = 'Personal',
  FISCAL = 'Fiscal',
  ACCOUNTING = 'Accounting',
  FINANCIAL = 'Financial'
}

export enum QueueDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound'
}

export interface Queue {
  id: string;
  sessionId: string;
  customerId: string;
  status: QueueStatus;
  department: Department;
  direction: QueueDirection;
  requestedOperatorId?: string;
  assignedOperatorId?: string;
  supervisorId?: string;
  typebotData: Record<string, any>;
  customerDepartmentChoice?: string;
  customerOperatorChoice?: string;
  operatorAvailable: boolean;
  createdAt: Date;
  typebotCompletedAt?: Date;
  assignedAt?: Date;
  completedAt?: Date;
  evolutionInstance?: string;
  typebotSessionUrl?: string;
  metadata: Record<string, any>;
}

export interface CreateQueueDto {
  sessionId: string;
  customerId: string;
  direction?: QueueDirection;
  evolutionInstance?: string;
  typebotSessionUrl?: string;
  metadata?: Record<string, any>;
}

export interface UpdateQueueDto {
  status?: QueueStatus;
  department?: UserDepartment;
  direction?: QueueDirection;
  requestedOperatorId?: string;
  assignedOperatorId?: string;
  supervisorId?: string;
  typebotData?: Record<string, any>;
  customerDepartmentChoice?: string;
  customerOperatorChoice?: string;
  operatorAvailable?: boolean;
  typebotCompletedAt?: Date;
  assignedAt?: Date;
  completedAt?: Date;
  evolutionInstance?: string;
  typebotSessionUrl?: string;
  metadata?: Record<string, any>;
}

export interface QueueFilters {
  status?: QueueStatus;
  department?: Department;
  direction?: QueueDirection;
  assignedOperatorId?: string;
  customerId?: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface QueueMetrics {
  totalQueues: number;
  activeQueues: number;
  completedQueues: number;
  averageWaitTime: number;
  averageServiceTime: number;
  satisfactionScore: number;
}

export interface QueueWithCustomer extends Queue {
  customer: {
    id: string;
    remoteJid: string;
    pushName?: string;
    profilePicUrl?: string;
    email?: string;
    cpf?: string;
    cnpj?: string;
    priority: number;
    isGroup: boolean;
    isSaved: boolean;
    type: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
} 