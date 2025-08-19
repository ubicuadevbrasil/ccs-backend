import { Department } from '../../queues/interfaces/queue.interface';

export interface DashboardCardsDto {
  department?: Department;
  date?: string;
}

export interface DashboardCardsResponse {
  customersWaitingInQueue: number;
  averageWaitingTime: number; // in minutes
  customersInService: number;
  tabulatedCustomers: number;
  queueEntries: {
    inbound: number;
    outbound: number;
  };
}

export interface DashboardOperatorsResponse {
  operators: Array<{
    userId: string;
    userName: string;
    onlineTime: number; // in minutes
    customersInService: number;
    tabulatedCustomers: number;
  }>;
}

export interface DashboardTabulationsResponse {
  tabulations: Array<{
    sessionId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerCpf: string;
    userName: string;
    createdAt: Date;
    completedAt: Date;
    direction: string;
    tabulationStatusDescription: string;
    tabulationStatusSubDescription: string;
  }>;
  total: number;
}

export interface QueueMetricsData {
  waitingCount: number;
  inServiceCount: number;
  averageWaitTime: number;
  inboundCount: number;
  outboundCount: number;
}

export interface OperatorMetricsData {
  userId: string;
  userName: string;
  onlineTime: number;
  customersInService: number;
  tabulatedCustomers: number;
}

export interface DashboardQueuesResponse {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  userName: string;
  supervisorName: string;
  status: string;
  createdAt: Date;
  assignedAt: Date | null;
  department: string;
}
