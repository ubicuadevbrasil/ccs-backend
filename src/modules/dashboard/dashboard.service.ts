import { Injectable, Inject, forwardRef } from '@nestjs/common';
import type { Knex } from 'nestjs-knex';
import { InjectKnex } from 'nestjs-knex';
import { QueuesService } from '../queues/queues.service';
import { SocketService } from '../socket/socket.service';
import { TabulationsService } from '../tabulations/tabulations.service';
import { UsersService } from '../users/users.service';
import {
  DashboardCardsResponse,
  DashboardOperatorsResponse,
  DashboardTabulationsResponse,
  DashboardQueuesResponse,
  QueueMetricsData,
  OperatorMetricsData,
} from './interfaces/dashboard.interface';
import { DashboardCardsDto, DashboardTabulationsDto } from './dto/dashboard.dto';
import { QueueStatus, Department, QueueDirection } from '../queues/interfaces/queue.interface';

@Injectable()
export class DashboardService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    private readonly queuesService: QueuesService,
    @Inject(forwardRef(() => SocketService))
    private readonly socketService: SocketService,
    private readonly tabulationsService: TabulationsService,
    private readonly usersService: UsersService,
  ) {}

  async getDashboardCards(dto: DashboardCardsDto): Promise<DashboardCardsResponse> {
    try {
      const { department, startDate, endDate } = dto;
      
      let startDateObj: Date;
      let endDateObj: Date;
      
      if (startDate && endDate) {
        // Both dates provided
        startDateObj = new Date(startDate);
        endDateObj = new Date(endDate);
        
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          // Fallback to current day if dates are invalid
          startDateObj = new Date();
          endDateObj = new Date();
        }
      } else if (startDate) {
        // Only start date provided
        startDateObj = new Date(startDate);
        endDateObj = new Date();
        
        if (isNaN(startDateObj.getTime())) {
          startDateObj = new Date();
        }
      } else if (endDate) {
        // Only end date provided
        startDateObj = new Date();
        endDateObj = new Date(endDate);
        
        if (isNaN(endDateObj.getTime())) {
          endDateObj = new Date();
        }
      } else {
        // No dates provided - use current day
        startDateObj = new Date();
        endDateObj = new Date();
      }
      
      // Set time range for the day (00:00:00 to 23:59:59)
      const startOfDay = new Date(startDateObj);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(endDateObj);
      endOfDay.setHours(23, 59, 59, 999);

      const queueMetrics = await this.getQueueMetricsData(department, startOfDay, endOfDay);
      const tabulatedCustomers = await this.getTabulatedCustomersCount(department, startOfDay, endOfDay);

      return {
        customersWaitingInQueue: queueMetrics.waitingCount,
        averageWaitingTime: queueMetrics.averageWaitTime,
        customersInService: queueMetrics.inServiceCount,
        tabulatedCustomers,
        queueEntries: {
          inbound: queueMetrics.inboundCount,
          outbound: queueMetrics.outboundCount,
        },
      };
    } catch (error) {
      // Return default values if there's an error
      return {
        customersWaitingInQueue: 0,
        averageWaitingTime: 0,
        customersInService: 0,
        tabulatedCustomers: 0,
        queueEntries: {
          inbound: 0,
          outbound: 0,
        },
      };
    }
  }

  async getDashboardOperators(): Promise<DashboardOperatorsResponse> {
    try {
      const connectedOperators = this.socketService.getConnectedOperators();
      const operators: OperatorMetricsData[] = [];

      for (const operator of connectedOperators) {
        const metrics = await this.getOperatorMetrics(operator.operatorId);
        operators.push(metrics);
      }

      return { operators };
    } catch (error) {
      // Return empty operators list if there's an error
      return { operators: [] };
    }
  }

  async getDashboardTabulations(dto: DashboardTabulationsDto): Promise<DashboardTabulationsResponse> {
    try {
      const { startDate, endDate, customerName, customerPhone, customerCpf, customerEmail, direction, tabulationStatus } = dto;
      
      let startDateObj: Date | undefined;
      let endDateObj: Date | undefined;
      
      if (startDate) {
        startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
          startDateObj = undefined;
        }
      }
      
      if (endDate) {
        endDateObj = new Date(endDate);
        if (isNaN(endDateObj.getTime())) {
          endDateObj = undefined;
        }
      }

      let query = this.knex('queues')
        .join('tabulations', 'queues.sessionId', 'tabulations.sessionId')
        .join('customers', 'queues.customerId', 'customers.id')
        .join('users', 'tabulations.tabulatedBy', 'users.id')
        .join('tabulationStatusSub', 'tabulations.tabulationId', 'tabulationStatusSub.id')
        .join('tabulationStatus', 'tabulationStatusSub.tabulationStatusId', 'tabulationStatus.id')
        .where('queues.status', QueueStatus.COMPLETED)
        .whereNotNull('queues.completedAt')
        .select(
          'queues.sessionId',
          'customers.pushName as customerName',
          'customers.remoteJid as customerPhone',
          'customers.email as customerEmail',
          'customers.cpf as customerCpf',
          'users.name as userName',
          'queues.createdAt',
          'queues.completedAt',
          'queues.direction',
          'tabulationStatus.description as tabulationStatusDescription',
          'tabulationStatusSub.description as tabulationStatusSubDescription'
        );

      // Apply filters
      if (startDateObj && endDateObj) {
        // Both dates provided - use the range as is
        const startOfDay = new Date(startDateObj);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(endDateObj);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query.whereBetween('queues.completedAt', [startOfDay, endOfDay]);
      } else if (startDateObj) {
        // Only start date provided - from start date to now
        const startOfDay = new Date(startDateObj);
        startOfDay.setHours(0, 0, 0, 0);
        
        query = query.where('queues.completedAt', '>=', startOfDay);
      } else if (endDateObj) {
        // Only end date provided - from beginning to end date
        const endOfDay = new Date(endDateObj);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query.where('queues.completedAt', '<=', endOfDay);
      }

      if (customerName) {
        query = query.where('customers.pushName', 'ilike', `%${customerName}%`);
      }

      if (customerPhone) {
        query = query.where('customers.remoteJid', customerPhone);
      }

      if (customerCpf) {
        query = query.where('customers.cpf', customerCpf);
      }

      if (customerEmail) {
        query = query.where('customers.email', 'ilike', `%${customerEmail}%`);
      }

      if (direction) {
        query = query.where('queues.direction', direction);
      }

      if (tabulationStatus) {
        query = query.where('tabulationStatus.id', tabulationStatus);
      }

      // Order by completion date (most recent first)
      query = query.orderBy('queues.completedAt', 'desc');

      const tabulations = await query;

      return {
        tabulations: tabulations.map(tab => ({
          sessionId: tab.sessionId,
          customerName: tab.customerName || 'N/A',
          customerPhone: tab.customerPhone || 'N/A',
          customerEmail: tab.customerEmail || 'N/A',
          customerCpf: tab.customerCpf || 'N/A',
          userName: tab.userName || 'N/A',
          createdAt: tab.createdAt,
          completedAt: tab.completedAt,
          direction: tab.direction,
          tabulationStatusDescription: tab.tabulationStatusDescription || 'N/A',
          tabulationStatusSubDescription: tab.tabulationStatusSubDescription || 'N/A',
        })),
        total: tabulations.length,
      };
    } catch (error) {
      console.error('Error fetching dashboard tabulations:', error);
      return {
        tabulations: [],
        total: 0,
      };
    }
  }

  async getDashboardQueues(department?: Department): Promise<DashboardQueuesResponse[]> {
    try {
      // Get queues with status: typebot, waiting, service
      const queues = await this.knex('queues')
        .join('customers', 'queues.customerId', 'customers.id')
        .leftJoin('users', 'queues.assignedOperatorId', 'users.id')
        .leftJoin('users as supervisor', 'queues.supervisorId', 'supervisor.id')
        .whereIn('queues.status', [QueueStatus.TYPEBOT, QueueStatus.WAITING, QueueStatus.SERVICE])
        .select(
          'queues.sessionId',
          'customers.pushName as customerName',
          'customers.remoteJid as customerPhone',
          'users.name as userName',
          'supervisor.name as supervisorName',
          'queues.status',
          'queues.createdAt',
          'queues.assignedAt',
          'queues.department'
        )
        .orderBy('queues.createdAt', 'desc');

      // Filter by department if provided
      const filteredQueues = department 
        ? queues.filter(queue => queue.department === department)
        : queues;

      return filteredQueues.map(queue => ({
        sessionId: queue.sessionId,
        customerName: queue.customerName || 'N/A',
        customerPhone: queue.customerPhone || 'N/A',
        userName: queue.userName || 'N/A',
        supervisorName: queue.supervisorName || 'N/A',
        status: queue.status,
        createdAt: queue.createdAt,
        assignedAt: queue.assignedAt,
        department: queue.department
      }));
    } catch (error) {
      console.error('Error fetching dashboard queues:', error);
      return [];
    }
  }

  private async getQueueMetricsData(
    department?: Department,
    startDate?: Date,
    endDate?: Date,
  ): Promise<QueueMetricsData> {
    let query = this.knex('queues')
      .select('*');
    
    if (startDate && endDate) {
      query = query.whereBetween('createdAt', [startDate, endDate]).orWhereBetween('typebotCompletedAt', [startDate, endDate]);
    }

    if (department) {
      query = query.where({ department });
    }

    const queues = await query;

    console.log('queues', queues);
    const waitingCount = queues.filter(q => q.status === QueueStatus.WAITING).length;
    const inServiceCount = queues.filter(q => q.status === QueueStatus.SERVICE).length;
    const inboundCount = queues.filter(q => q.direction === QueueDirection.INBOUND).length;
    const outboundCount = queues.filter(q => q.direction === QueueDirection.OUTBOUND).length;

    // Calculate average waiting time only for inbound queues that have been served
    let totalWaitTime = 0;
    let waitTimeCount = 0;

    for (const queue of queues) {
      // Only calculate for inbound queues that have been served (have assignedAt)
      if (queue.direction === QueueDirection.INBOUND && queue.assignedAt && queue.createdAt) {
        const waitTime = new Date(queue.assignedAt).getTime() - new Date(queue.createdAt).getTime();
        if (waitTime > 0) {
          totalWaitTime += waitTime;
          waitTimeCount++;
        }
      }
    }

    const averageWaitTime = waitTimeCount > 0 ? Math.round(totalWaitTime / waitTimeCount / (1000 * 60)) : 0;
    return {
      waitingCount,
      inServiceCount,
      averageWaitTime,
      inboundCount,
      outboundCount,
    };
  }

  private async getTabulatedCustomersCount(
    department?: Department,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let query = this.knex('tabulations')
      .join('queues', 'tabulations.sessionId', 'queues.sessionId');
    
    if (startDate && endDate) {
      query = query.whereBetween('tabulations.tabulatedAt', [startDate, endDate]);
    }

    if (department) {
      query = query.where('queues.department', department);
    }

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  private async getOperatorMetrics(operatorId: string): Promise<OperatorMetricsData> {
    // Get operator info
    const user = await this.usersService.findOne(operatorId);
    
    // Get operator connection info
    const connectedOperators = this.socketService.getConnectedOperators();
    const operatorConnection = connectedOperators.find(op => op.operatorId === operatorId);
    
    // Calculate online time
    const onlineTime = operatorConnection 
      ? Math.round((Date.now() - new Date(operatorConnection.connectedAt).getTime()) / (1000 * 60))
      : 0;

    // Get customers in service for this operator
    const customersInService = await this.knex('queues')
      .where({
        assignedOperatorId: operatorId,
        status: QueueStatus.SERVICE,
      })
      .count('* as count')
      .first();

    // Get tabulated customers for this operator
    const tabulatedCustomers = await this.knex('tabulations')
      .where({ tabulatedBy: operatorId })
      .count('* as count')
      .first();

    return {
      userId: operatorId,
      userName: user?.name || 'Unknown',
      onlineTime,
      customersInService: parseInt(customersInService?.count as string) || 0,
      tabulatedCustomers: parseInt(tabulatedCustomers?.count as string) || 0,
    };
  }
}
