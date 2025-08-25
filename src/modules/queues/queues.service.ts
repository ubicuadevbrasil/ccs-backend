import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import type { Knex } from 'nestjs-knex';
import { InjectKnex } from 'nestjs-knex';
import {
  Queue,
  CreateQueueDto,
  UpdateQueueDto,
  QueueFilters,
  QueueMetrics,
  QueueStatus,
  Department,
  QueueDirection,
  QueueWithCustomer
} from './interfaces/queue.interface';
import { CustomerService } from '../customer/customer.service';
import { EvolutionService } from '../evolution/evolution.service';
import { ConfigService } from '@nestjs/config';
import { User, UserDepartment } from '../users/interfaces/user.interface';
import { SocketService } from '../socket/socket.service';
import { TabulationsService } from '../tabulations/tabulations.service';
import { CompleteQueueServiceDto } from './dto/queue.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);

  constructor(
    @InjectKnex() private readonly knex: Knex,
    private readonly customerService: CustomerService,
    private readonly evolutionService: EvolutionService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => SocketService))
    private readonly socketService: SocketService,
    private readonly tabulationsService: TabulationsService
  ) { }

  async createQueue(createQueueDto: CreateQueueDto): Promise<Queue> {
    const [queue] = await this.knex('queues')
      .insert({
        sessionId: createQueueDto.sessionId,
        customerId: createQueueDto.customerId,
        status: QueueStatus.TYPEBOT,
        department: Department.PERSONAL, // Default department
        direction: createQueueDto.direction || QueueDirection.INBOUND, // Default to inbound
        typebotData: {},
        operatorAvailable: false,
        evolutionInstance: createQueueDto.evolutionInstance,
        typebotSessionUrl: createQueueDto.typebotSessionUrl,
        metadata: createQueueDto.metadata || {}
      })
      .returning('*');

    return queue;
  }

  async createQueueFromCustomerPhone(
    sessionId: string,
    customerPhone: string,
    evolutionInstance?: string,
    typebotSessionUrl?: string,
    metadata?: Record<string, any>
  ): Promise<Queue> {
    // Find or create customer by phone number
    let customer = await this.customerService.findByRemoteJid(customerPhone);

    if (!customer) {
      // Create customer if not found using centralized method
      customer = await this.customerService.createOrUpdateFromWhatsAppData({
        remoteJid: customerPhone,
        pushName: metadata?.customerName,
        instance: evolutionInstance, // Pass instance for profile picture fetch
        type: 'contact',
        status: 'active'
      });
    }

    return this.createQueue({
      sessionId,
      customerId: customer.id,
      direction: QueueDirection.INBOUND, // Customer phone calls are inbound by default
      evolutionInstance,
      typebotSessionUrl,
      metadata
    });
  }

  async findQueueById(id: string): Promise<Queue | null> {
    const [queue] = await this.knex('queues')
      .where({ id })
      .select('*');

    return queue || null;
  }

  async findQueueWithCustomer(id: string): Promise<QueueWithCustomer | null> {
    const queue = await this.knex('queues')
      .join('customers', 'queues.customerId', 'customers.id')
      .where('queues.id', id)
      .select(
        'queues.id as queue_id',
        'queues.sessionId',
        'queues.customerId',
        'queues.status as queue_status',
        'queues.department',
        'queues.direction',
        'queues.requestedOperatorId',
        'queues.assignedOperatorId',
        'queues.supervisorId',
        'queues.typebotData',
        'queues.customerDepartmentChoice',
        'queues.customerOperatorChoice',
        'queues.operatorAvailable',
        'queues.createdAt as queue_createdAt',
        'queues.typebotCompletedAt',
        'queues.assignedAt',
        'queues.completedAt',
        'queues.evolutionInstance',
        'queues.typebotSessionUrl',
        'queues.metadata as queue_metadata',
        'customers.id as customer_id',
        'customers.remoteJid',
        'customers.pushName',
        'customers.profilePicUrl',
        'customers.email',
        'customers.cpf',
        'customers.cnpj',
        'customers.priority',
        'customers.isGroup',
        'customers.isSaved',
        'customers.type',
        'customers.status as customer_status',
        'customers.createdAt as customer_createdAt',
        'customers.updatedAt as customer_updatedAt'
      )
      .first();

    if (!queue) {
      return null;
    }

    // Separate queue and customer data
    const queueData = {
      id: queue.queue_id,
      sessionId: queue.sessionId,
      customerId: queue.customerId,
      status: queue.queue_status,
      department: queue.department,
      direction: queue.direction,
      requestedOperatorId: queue.requestedOperatorId,
      assignedOperatorId: queue.assignedOperatorId,
      supervisorId: queue.supervisorId,
      typebotData: queue.typebotData,
      customerDepartmentChoice: queue.customerDepartmentChoice,
      customerOperatorChoice: queue.customerOperatorChoice,
      operatorAvailable: queue.operatorAvailable,
      createdAt: queue.queue_createdAt,
      typebotCompletedAt: queue.typebotCompletedAt,
      assignedAt: queue.assignedAt,
      completedAt: queue.completedAt,
      evolutionInstance: queue.evolutionInstance,
      typebotSessionUrl: queue.typebotSessionUrl,
      metadata: queue.queue_metadata,
    };

    const customerData = {
      id: queue.customer_id,
      remoteJid: queue.remoteJid,
      pushName: queue.pushName,
      profilePicUrl: queue.profilePicUrl,
      email: queue.email,
      cpf: queue.cpf,
      cnpj: queue.cnpj,
      priority: queue.priority,
      isGroup: queue.isGroup,
      isSaved: queue.isSaved,
      type: queue.type,
      status: queue.customer_status,
      createdAt: queue.customer_createdAt,
      updatedAt: queue.customer_updatedAt,
    };

    return { ...queueData, customer: customerData };
  }

  async findQueueBySessionId(sessionId: string): Promise<Queue | null> {
    const [queue] = await this.knex('queues')
      .where({ sessionId })
      .select('*');

    return queue || null;
  }

  async findQueueByCustomerPhone(customerPhone: string): Promise<Queue | null> {
    // Find customer by remoteJid (phone number)
    const customer = await this.customerService.findByRemoteJid(customerPhone);
    if (!customer) {
      return null;
    }

    const [queue] = await this.knex('queues')
      .where({ customerId: customer.id })
      .whereNot('status', QueueStatus.COMPLETED)
      .whereNot('status', QueueStatus.CANCELLED)
      .orderBy('createdAt', 'desc')
      .select('*');

    return queue || null;
  }

  async findQueuesByRemoteJid(remoteJid: string, statuses?: QueueStatus[]): Promise<QueueWithCustomer[]> {
    // Find customer by remoteJid
    const customer = await this.customerService.findByRemoteJid(remoteJid.replace('@s.whatsapp.net', ''));
    if (!customer) {
      return [];
    }

    // Build the base query
    let query = this.knex('queues')
      .join('customers', 'queues.customerId', 'customers.id')
      .where('queues.customerId', customer.id);

    // Apply status filter if provided
    if (statuses && statuses.length > 0) {
      query = query.whereIn('queues.status', statuses);
    }

    // Find all queues for this customer with customer information
    const queues = await query
      .select(
        'queues.id as queue_id',
        'queues.sessionId',
        'queues.customerId',
        'queues.status as queue_status',
        'queues.department',
        'queues.direction',
        'queues.requestedOperatorId',
        'queues.assignedOperatorId',
        'queues.supervisorId',
        'queues.typebotData',
        'queues.customerDepartmentChoice',
        'queues.customerOperatorChoice',
        'queues.operatorAvailable',
        'queues.createdAt',
        'queues.typebotCompletedAt',
        'queues.assignedAt',
        'queues.completedAt',
        'queues.evolutionInstance',
        'queues.typebotSessionUrl',
        'queues.metadata',
        'customers.id as customer_id',
        'customers.remoteJid',
        'customers.pushName',
        'customers.profilePicUrl',
        'customers.email',
        'customers.cpf',
        'customers.cnpj',
        'customers.priority',
        'customers.isGroup',
        'customers.isSaved',
        'customers.type',
        'customers.status as customer_status',
        'customers.createdAt as customer_created_at',
        'customers.updatedAt as customer_updated_at'
      )
      .orderBy('queues.createdAt', 'desc');

    return queues.map(queue => ({
      id: queue.queue_id,
      sessionId: queue.sessionId,
      customerId: queue.customerId,
      status: queue.queue_status,
      department: queue.department,
      direction: queue.direction,
      requestedOperatorId: queue.requestedOperatorId,
      assignedOperatorId: queue.assignedOperatorId,
      supervisorId: queue.supervisorId,
      typebotData: queue.typebotData,
      customerDepartmentChoice: queue.customerDepartmentChoice,
      customerOperatorChoice: queue.customerOperatorChoice,
      operatorAvailable: queue.operatorAvailable,
      createdAt: queue.createdAt,
      typebotCompletedAt: queue.typebotCompletedAt,
      assignedAt: queue.assignedAt,
      completedAt: queue.completedAt,
      evolutionInstance: queue.evolutionInstance,
      typebotSessionUrl: queue.typebotSessionUrl,
      metadata: queue.metadata,
      customer: {
        id: queue.customer_id,
        remoteJid: queue.remoteJid,
        pushName: queue.pushName,
        profilePicUrl: queue.profilePicUrl,
        email: queue.email,
        cpf: queue.cpf,
        cnpj: queue.cnpj,
        priority: queue.priority,
        isGroup: queue.isGroup,
        isSaved: queue.isSaved,
        type: queue.type,
        status: queue.customer_status,
        createdAt: queue.customer_created_at,
        updatedAt: queue.customer_updated_at
      }
    }));
  }

  async findQueues(filters: QueueFilters = {}): Promise<Queue[]> {
    let query = this.knex('queues').select('*');

    if (filters.status) {
      query = query.where({ status: filters.status });
    }

    if (filters.department) {
      query = query.where({ department: filters.department });
    }

    if (filters.direction) {
      query = query.where({ direction: filters.direction });
    }

    if (filters.assignedOperatorId) {
      query = query.where({ assignedOperatorId: filters.assignedOperatorId });
    }

    if (filters.customerId) {
      query = query.where({ customerId: filters.customerId });
    }

    if (filters.sessionId) {
      query = query.where({ sessionId: filters.sessionId });
    }

    if (filters.startDate) {
      query = query.where('createdAt', '>=', filters.startDate);
    }

    if (filters.endDate) {
      query = query.where('createdAt', '<=', filters.endDate);
    }

    return query.orderBy('createdAt', 'desc');
  }

  async updateQueue(id: string, updateQueueDto: UpdateQueueDto): Promise<Queue | null> {
    const updateData: any = {};

    // Handle status transitions
    if (updateQueueDto.status) {
      updateData.status = updateQueueDto.status;

      // Set timestamps based on status
      if (updateQueueDto.status === QueueStatus.WAITING && updateQueueDto.typebotCompletedAt) {
        updateData.typebotCompletedAt = updateQueueDto.typebotCompletedAt;
      }

      if (updateQueueDto.status === QueueStatus.SERVICE && updateQueueDto.assignedAt) {
        updateData.assignedAt = updateQueueDto.assignedAt;
      }

      if (updateQueueDto.status === QueueStatus.COMPLETED && updateQueueDto.completedAt) {
        updateData.completedAt = updateQueueDto.completedAt;
      }
    }

    // Update other fields
    if (updateQueueDto.department) updateData.department = updateQueueDto.department;
    if (updateQueueDto.direction) updateData.direction = updateQueueDto.direction;
    if (updateQueueDto.requestedOperatorId) updateData.requestedOperatorId = updateQueueDto.requestedOperatorId;
    if (updateQueueDto.assignedOperatorId) updateData.assignedOperatorId = updateQueueDto.assignedOperatorId;
    if (updateQueueDto.supervisorId) updateData.supervisorId = updateQueueDto.supervisorId;
    if (updateQueueDto.typebotData) updateData.typebotData = updateQueueDto.typebotData;
    if (updateQueueDto.customerDepartmentChoice) updateData.customerDepartmentChoice = updateQueueDto.customerDepartmentChoice;
    if (updateQueueDto.customerOperatorChoice) updateData.customerOperatorChoice = updateQueueDto.customerOperatorChoice;
    if (updateQueueDto.operatorAvailable !== undefined) updateData.operatorAvailable = updateQueueDto.operatorAvailable;
    if (updateQueueDto.evolutionInstance) updateData.evolutionInstance = updateQueueDto.evolutionInstance;
    if (updateQueueDto.typebotSessionUrl) updateData.typebotSessionUrl = updateQueueDto.typebotSessionUrl;
    if (updateQueueDto.metadata) updateData.metadata = updateQueueDto.metadata;

    const [updatedQueue] = await this.knex('queues')
      .where({ id })
      .update(updateData)
      .returning('*');

    return updatedQueue || null;
  }

  async assignOperator(queueId: string, operatorId: string): Promise<Queue | null> {
    const [queue] = await this.knex('queues')
      .where({ id: queueId })
      .update({
        assignedOperatorId: operatorId,
        assignedAt: new Date(),
        status: QueueStatus.SERVICE
      })
      .returning('*');

    return queue || null;
  }

  async completeQueue(queueId: string): Promise<Queue | null> {
    const [queue] = await this.knex('queues')
      .where({ id: queueId })
      .update({
        status: QueueStatus.COMPLETED,
        completedAt: new Date()
      })
      .returning('*');

    return queue || null;
  }

  async cancelQueue(queueId: string): Promise<Queue | null> {
    const [queue] = await this.knex('queues')
      .where({ id: queueId })
      .update({
        status: QueueStatus.CANCELLED,
        completedAt: new Date()
      })
      .returning('*');

    return queue || null;
  }

  async findAvailableQueues(department?: Department): Promise<Queue[]> {
    let query = this.knex('queues')
      .where({ status: QueueStatus.WAITING })
      .select('*');

    if (department) {
      query = query.where({ department });
    }

    return query.orderBy('createdAt', 'asc');
  }

  async findOperatorQueues(operatorId: string): Promise<Queue[]> {
    return this.knex('queues')
      .where({ assignedOperatorId: operatorId })
      .whereIn('status', [QueueStatus.SERVICE, QueueStatus.WAITING])
      .select('*')
      .orderBy('createdAt', 'asc');
  }

  async getQueueMetrics(startDate?: Date, endDate?: Date): Promise<QueueMetrics> {
    let query = this.knex('queues');

    if (startDate) {
      query = query.where('createdAt', '>=', startDate);
    }

    if (endDate) {
      query = query.where('createdAt', '<=', endDate);
    }

    const [metrics] = await query
      .select(
        this.knex.raw('COUNT(*) as total_queues'),
        this.knex.raw('COUNT(CASE WHEN status IN (?, ?) THEN 1 END) as active_queues', [QueueStatus.WAITING, QueueStatus.SERVICE]),
        this.knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as completed_queues', [QueueStatus.COMPLETED]),
        this.knex.raw('AVG(EXTRACT(EPOCH FROM (assignedAt - createdAt))) as avg_wait_time'),
        this.knex.raw('AVG(EXTRACT(EPOCH FROM (completedAt - assignedAt))) as avg_service_time')
      );

    return {
      totalQueues: parseInt(metrics.total_queues) || 0,
      activeQueues: parseInt(metrics.active_queues) || 0,
      completedQueues: parseInt(metrics.completed_queues) || 0,
      averageWaitTime: parseFloat(metrics.avg_wait_time) || 0,
      averageServiceTime: parseFloat(metrics.avg_service_time) || 0,
      satisfactionScore: 0 // TODO: Implement satisfaction score calculation
    };
  }

  async deleteQueue(id: string): Promise<boolean> {
    const deletedCount = await this.knex('queues')
      .where({ id })
      .del();

    return deletedCount > 0;
  }

  async findWaitingQueuesByUser(userId: string): Promise<QueueWithCustomer[]> {
    const queues = await this.knex('queues')
      .join('customers', 'queues.customerId', 'customers.id')
      .where('queues.status', QueueStatus.WAITING)
      .where(function () {
        this.where('queues.requestedOperatorId', userId)
          .orWhere('queues.supervisorId', userId);
      })
      .select(
        'queues.id as queue_id',
        'queues.sessionId',
        'queues.customerId',
        'queues.status as queue_status',
        'queues.department',
        'queues.direction',
        'queues.requestedOperatorId',
        'queues.assignedOperatorId',
        'queues.supervisorId',
        'queues.typebotData',
        'queues.customerDepartmentChoice',
        'queues.customerOperatorChoice',
        'queues.operatorAvailable',
        'queues.createdAt as queue_createdAt',
        'queues.typebotCompletedAt',
        'queues.assignedAt',
        'queues.completedAt',
        'queues.evolutionInstance',
        'queues.typebotSessionUrl',
        'queues.metadata as queue_metadata',
        'customers.id as customer_id',
        'customers.remoteJid',
        'customers.pushName',
        'customers.profilePicUrl',
        'customers.email',
        'customers.cpf',
        'customers.cnpj',
        'customers.priority',
        'customers.isGroup',
        'customers.isSaved',
        'customers.type',
        'customers.status as customer_status',
        'customers.createdAt as customer_createdAt',
        'customers.updatedAt as customer_updatedAt'
      )
      .orderBy('queues.createdAt', 'asc');

    return queues.map(queue => {
      // Separate queue and customer data
      const queueData = {
        id: queue.queue_id,
        sessionId: queue.sessionId,
        customerId: queue.customerId,
        status: queue.queue_status,
        department: queue.department,
        direction: queue.direction,
        requestedOperatorId: queue.requestedOperatorId,
        assignedOperatorId: queue.assignedOperatorId,
        supervisorId: queue.supervisorId,
        typebotData: queue.typebotData,
        customerDepartmentChoice: queue.customerDepartmentChoice,
        customerOperatorChoice: queue.customerOperatorChoice,
        operatorAvailable: queue.operatorAvailable,
        createdAt: queue.queue_createdAt,
        typebotCompletedAt: queue.typebotCompletedAt,
        assignedAt: queue.assignedAt,
        completedAt: queue.completedAt,
        evolutionInstance: queue.evolutionInstance,
        typebotSessionUrl: queue.typebotSessionUrl,
        metadata: queue.queue_metadata,
      };

      const customerData = {
        id: queue.customer_id,
        remoteJid: queue.remoteJid,
        pushName: queue.pushName,
        profilePicUrl: queue.profilePicUrl,
        email: queue.email,
        cpf: queue.cpf,
        cnpj: queue.cnpj,
        priority: queue.priority,
        isGroup: queue.isGroup,
        isSaved: queue.isSaved,
        type: queue.type,
        status: queue.customer_status,
        createdAt: queue.customer_createdAt,
        updatedAt: queue.customer_updatedAt,
      };

      return { ...queueData, customer: customerData };
    });
  }

  async findServiceQueuesByUser(userId: string): Promise<QueueWithCustomer[]> {
    const queues = await this.knex('queues')
      .join('customers', 'queues.customerId', 'customers.id')
      .where('queues.status', QueueStatus.SERVICE)
      .where(function () {
        this.where('queues.assignedOperatorId', userId);
      })
      .select(
        'queues.id as queue_id',
        'queues.sessionId',
        'queues.customerId',
        'queues.status as queue_status',
        'queues.department',
        'queues.direction',
        'queues.requestedOperatorId',
        'queues.assignedOperatorId',
        'queues.supervisorId',
        'queues.typebotData',
        'queues.customerDepartmentChoice',
        'queues.customerOperatorChoice',
        'queues.operatorAvailable',
        'queues.createdAt as queue_createdAt',
        'queues.typebotCompletedAt',
        'queues.assignedAt',
        'queues.completedAt',
        'queues.evolutionInstance',
        'queues.typebotSessionUrl',
        'queues.metadata as queue_metadata',
        'customers.id as customer_id',
        'customers.remoteJid',
        'customers.pushName',
        'customers.profilePicUrl',
        'customers.email',
        'customers.cpf',
        'customers.cnpj',
        'customers.priority',
        'customers.isGroup',
        'customers.isSaved',
        'customers.type',
        'customers.status as customer_status',
        'customers.createdAt as customer_createdAt',
        'customers.updatedAt as customer_updatedAt'
      )
      .orderBy('queues.createdAt', 'asc');

    return queues.map(queue => {
      // Separate queue and customer data
      const queueData = {
        id: queue.queue_id,
        sessionId: queue.sessionId,
        customerId: queue.customerId,
        status: queue.queue_status,
        department: queue.department,
        direction: queue.direction,
        requestedOperatorId: queue.requestedOperatorId,
        assignedOperatorId: queue.assignedOperatorId,
        supervisorId: queue.supervisorId,
        typebotData: queue.typebotData,
        customerDepartmentChoice: queue.customerDepartmentChoice,
        customerOperatorChoice: queue.customerOperatorChoice,
        operatorAvailable: queue.operatorAvailable,
        createdAt: queue.queue_createdAt,
        typebotCompletedAt: queue.typebotCompletedAt,
        assignedAt: queue.assignedAt,
        completedAt: queue.completedAt,
        evolutionInstance: queue.evolutionInstance,
        typebotSessionUrl: queue.typebotSessionUrl,
        metadata: queue.queue_metadata,
      };

      const customerData = {
        id: queue.customer_id,
        remoteJid: queue.remoteJid,
        pushName: queue.pushName,
        profilePicUrl: queue.profilePicUrl,
        email: queue.email,
        cpf: queue.cpf,
        cnpj: queue.cnpj,
        priority: queue.priority,
        isGroup: queue.isGroup,
        isSaved: queue.isSaved,
        type: queue.type,
        status: queue.customer_status,
        createdAt: queue.customer_createdAt,
        updatedAt: queue.customer_updatedAt,
      };

      return { ...queueData, customer: customerData };
    });
  }

  async findAllQueuesWithCustomers(): Promise<QueueWithCustomer[]> {
    const queues = await this.knex('queues')
      .join('customers', 'queues.customerId', 'customers.id')
      .select(
        'queues.id as queue_id',
        'queues.sessionId',
        'queues.customerId',
        'queues.status as queue_status',
        'queues.department',
        'queues.direction',
        'queues.requestedOperatorId',
        'queues.assignedOperatorId',
        'queues.supervisorId',
        'queues.typebotData',
        'queues.customerDepartmentChoice',
        'queues.customerOperatorChoice',
        'queues.operatorAvailable',
        'queues.createdAt as queue_createdAt',
        'queues.typebotCompletedAt',
        'queues.assignedAt',
        'queues.completedAt',
        'queues.evolutionInstance',
        'queues.typebotSessionUrl',
        'queues.metadata as queue_metadata',
        'customers.id as customer_id',
        'customers.remoteJid',
        'customers.pushName',
        'customers.profilePicUrl',
        'customers.email',
        'customers.cpf',
        'customers.cnpj',
        'customers.priority',
        'customers.isGroup',
        'customers.isSaved',
        'customers.type',
        'customers.status as customer_status',
        'customers.createdAt as customer_createdAt',
        'customers.updatedAt as customer_updatedAt'
      )
      .orderBy('queues.createdAt', 'desc');

    return queues.map(queue => {
      // Separate queue and customer data
      const queueData = {
        id: queue.queue_id,
        sessionId: queue.sessionId,
        customerId: queue.customerId,
        status: queue.queue_status,
        department: queue.department,
        direction: queue.direction,
        requestedOperatorId: queue.requestedOperatorId,
        assignedOperatorId: queue.assignedOperatorId,
        supervisorId: queue.supervisorId,
        typebotData: queue.typebotData,
        customerDepartmentChoice: queue.customerDepartmentChoice,
        customerOperatorChoice: queue.customerOperatorChoice,
        operatorAvailable: queue.operatorAvailable,
        createdAt: queue.queue_createdAt,
        typebotCompletedAt: queue.typebotCompletedAt,
        assignedAt: queue.assignedAt,
        completedAt: queue.completedAt,
        evolutionInstance: queue.evolutionInstance,
        typebotSessionUrl: queue.typebotSessionUrl,
        metadata: queue.queue_metadata,
      };

      const customerData = {
        id: queue.customer_id,
        remoteJid: queue.remoteJid,
        pushName: queue.pushName,
        profilePicUrl: queue.profilePicUrl,
        email: queue.email,
        cpf: queue.cpf,
        cnpj: queue.cnpj,
        priority: queue.priority,
        isGroup: queue.isGroup,
        isSaved: queue.isSaved,
        type: queue.type,
        status: queue.customer_status,
        createdAt: queue.customer_createdAt,
        updatedAt: queue.customer_updatedAt,
      };

      return { ...queueData, customer: customerData };
    });
  }

  async startQueueService(queueId: string, operator: User): Promise<QueueWithCustomer | null> {
    // First, check if the queue exists and is in waiting status
    console.log(queueId);
    const queue = await this.findQueueById(queueId);
    console.log(queue);
    if (!queue) {
      return null;
    }

    if (queue.status !== QueueStatus.WAITING) {
      throw new Error('Queue is not in waiting status');
    }

    if (queue.assignedOperatorId) {
      throw new Error('Queue is already assigned to an operator');
    }

    // Get customer information to pause typebot session
    const queueWithCustomer = await this.findQueueWithCustomer(queueId);
    if (!queueWithCustomer) {
      throw new Error('Customer information not found');
    }

    // Pause typebot session if evolution instance is available
    if (queue.evolutionInstance && queueWithCustomer.customer.remoteJid) {
      try {
        await this.evolutionService.changeSessionStatus(queue.evolutionInstance, {
          remoteJid: queueWithCustomer.customer.remoteJid,
          status: 'paused'
        });
      } catch (error) {
        // Log error but don't fail the queue assignment
        console.error('Failed to pause typebot session:', error);
      }
    }

    // Update the queue to start service
    const updatedQueue = await this.updateQueue(queueId, {
      status: QueueStatus.SERVICE,
      assignedOperatorId: operator.id,
      assignedAt: new Date()
    });

    if (!updatedQueue) {
      return null;
    }

    // Send the initial message
    try {
      const messageText = `*${operator.name}* iniciou o atendimento.`;
      const defaultInstance = this.configService.get<string>('EVOLUTION_API_INSTANCE') || '';

      await this.evolutionService.sendText(defaultInstance, {
        number: `${queueWithCustomer?.customer.remoteJid}@s.whatsapp.net`,
        text: messageText
      });

      // this.logger.log(`Initial outbound message sent to ${remoteJid}: ${messageText}`); // Assuming logger is available
    } catch (error) {
      // this.logger.error(`Error sending initial outbound message to ${remoteJid}:`, error); // Assuming logger is available
      // Don't fail the entire operation if message sending fails
    }
    // Return the updated queue with customer information
    return this.findQueueWithCustomer(queueId);
  }

  async completeQueueService(queueId: string, operator: User, completeQueueServiceDto: CompleteQueueServiceDto): Promise<QueueWithCustomer | null> {
    const queue = await this.findQueueById(queueId);

    if (!queue) {
      return null;
    }

    if (queue.status !== QueueStatus.SERVICE) {
      throw new Error('Queue is not in service status');
    }

    if (queue.assignedOperatorId !== operator.id) {
      throw new Error('Only the assigned operator can complete this queue');
    }

    // Update queue status to completed
    const updatedQueue = await this.updateQueue(queueId, {
      status: QueueStatus.COMPLETED,
      completedAt: new Date()
    });

    if (!updatedQueue) {
      throw new Error('Failed to update queue status');
    }

    // Get the updated queue with customer information
    const queueWithCustomer = await this.findQueueWithCustomer(queueId);

    // Create tabulation record
    try {
      await this.tabulationsService.create({
        sessionId: queue.sessionId,
        tabulatedBy: operator.id,
        tabulationId: completeQueueServiceDto.tabulationStatusSubId
      });
    } catch (error) {
      // Log error but don't fail the entire operation if tabulation creation fails
      console.error(`Error creating tabulation for queue ${queueId}:`, error);
    }

    // Send the initial message
    try {
      const messageText = `*${operator.name}* encerrou o atendimento.`;
      const defaultInstance = this.configService.get<string>('EVOLUTION_API_INSTANCE') || '';

      await this.evolutionService.sendText(defaultInstance, {
        number: `${queueWithCustomer?.customer.remoteJid}@s.whatsapp.net`,
        text: messageText
      });

      // this.logger.log(`Initial outbound message sent to ${remoteJid}: ${messageText}`); // Assuming logger is available
    } catch (error) {
      // this.logger.error(`Error sending initial outbound message to ${remoteJid}:`, error); // Assuming logger is available
      // Don't fail the entire operation if message sending fails
    }

    if (queueWithCustomer && queueWithCustomer.evolutionInstance && queueWithCustomer.customer.remoteJid) {
      try {
        // Close the typebot session to enable future bot interactions
        await this.evolutionService.changeSessionStatus(queueWithCustomer.evolutionInstance, {
          remoteJid: `${queueWithCustomer.customer.remoteJid}@s.whatsapp.net`,
          status: 'closed'
        });

        console.log(`Typebot session closed for queue ${queueId} remoteJid ${queueWithCustomer.customer.remoteJid}`);
      } catch (error) {
        // this.logger.error(`Error closing typebot session for queue ${queueId}:`, error); // Assuming logger is available
        // Don't fail the entire operation if typebot session closing fails
      }
    }

    return queueWithCustomer;
  }

  async startOutboundConversation(
    remoteJid: string,
    operator: User
  ): Promise<QueueWithCustomer> {
    // Validate remoteJid format
    if (!remoteJid || !remoteJid.includes('@s.whatsapp.net')) {
      throw new Error('Invalid remoteJid format');
    }

    const queues = await this.findQueuesByRemoteJid(remoteJid);
    console.log(queues);
    if (queues.length > 0 && [QueueStatus.TYPEBOT, QueueStatus.WAITING, QueueStatus.SERVICE].includes(queues[0].status)) {
      throw new Error('Já existe uma atendimento iniciado para este número');
    }

    const defaultInstance = this.configService.get<string>('EVOLUTION_API_INSTANCE') || '';

    const checkWhatsAppNumbers = await this.evolutionService.checkWhatsAppNumbers(defaultInstance, {
      numbers: [remoteJid]
    });

    console.log(checkWhatsAppNumbers);
    if (!checkWhatsAppNumbers[0].exists) {
      throw new Error('Numero não encontrado no WhatsApp');
    }

    // Find or create customer by remoteJid
    let customer = await this.customerService.findByRemoteJid(remoteJid);

    if (!customer) {
      // Create customer if not found
      customer = await this.customerService.createOrUpdateFromWhatsAppData({
        remoteJid,
        pushName: undefined,
        instance: undefined,
        type: 'contact',
        status: 'active'
      });
    }


    // Create a unique session ID for the outbound conversation
    const sessionId = randomUUID();

    // Create the queue
    const queue = await this.createQueue({
      sessionId,
      customerId: customer.id,
      direction: QueueDirection.OUTBOUND,
      evolutionInstance: defaultInstance,
      typebotSessionUrl: undefined,
      metadata: {
        direction: 'outbound',
        initiatedBy: operator.id,
        initialMessage: `Olá, aqui é o(a) *${operator.name}* da *UNIDAS CONTABILIDADE*, tudo bem?`
      }
    });

    await this.updateQueue(queue.id, {
      assignedOperatorId: operator.id,
      assignedAt: new Date(),
      status: QueueStatus.SERVICE,
      department: operator.department,
      operatorAvailable: true
    });

    // Send the initial message
    try {
      const messageText = `Olá, aqui é o(a) *${operator.name}* da *UNIDAS CONTABILIDADE*, tudo bem?`;

      await this.evolutionService.sendText(defaultInstance, {
        number: remoteJid,
        text: messageText
      });

      // this.logger.log(`Initial outbound message sent to ${remoteJid}: ${messageText}`); // Assuming logger is available
    } catch (error) {
      // this.logger.error(`Error sending initial outbound message to ${remoteJid}:`, error); // Assuming logger is available
      // Don't fail the entire operation if message sending fails
    }

    // Return the queue with customer information
    const queueWithCustomer = await this.findQueueWithCustomer(queue.id);

    if (!queueWithCustomer) {
      throw new Error('Failed to retrieve created queue with customer information');
    }

    return queueWithCustomer;
  }

  async findMostRecentWaitingQueue(userId: string): Promise<QueueWithCustomer | null> {
    const [queue] = await this.knex('queues')
      .join('customers', 'queues.customerId', 'customers.id')
      .where('queues.status', QueueStatus.WAITING)
      .where(function () {
        this.where('queues.requestedOperatorId', userId)
          .orWhere('queues.supervisorId', userId);
      })
      .select(
        'queues.id as queue_id',
        'queues.sessionId',
        'queues.customerId',
        'queues.status as queue_status',
        'queues.department',
        'queues.direction',
        'queues.requestedOperatorId',
        'queues.assignedOperatorId',
        'queues.supervisorId',
        'queues.typebotData',
        'queues.customerDepartmentChoice',
        'queues.customerOperatorChoice',
        'queues.operatorAvailable',
        'queues.createdAt as queue_createdAt',
        'queues.typebotCompletedAt',
        'queues.assignedAt',
        'queues.completedAt',
        'queues.evolutionInstance',
        'queues.typebotSessionUrl',
        'queues.metadata as queue_metadata',
        'customers.id as customer_id',
        'customers.remoteJid',
        'customers.pushName',
        'customers.profilePicUrl',
        'customers.email',
        'customers.cpf',
        'customers.cnpj',
        'customers.priority',
        'customers.isGroup',
        'customers.isSaved',
        'customers.type',
        'customers.status as customer_status',
        'customers.createdAt as customer_createdAt',
        'customers.updatedAt as customer_updatedAt'
      )
      .orderBy('queues.createdAt', 'desc')
      .limit(1);

    if (!queue) {
      return null;
    }

    // Separate queue and customer data
    const queueData = {
      id: queue.queue_id,
      sessionId: queue.sessionId,
      customerId: queue.customerId,
      status: queue.queue_status,
      department: queue.department,
      direction: queue.direction,
      requestedOperatorId: queue.requestedOperatorId,
      assignedOperatorId: queue.assignedOperatorId,
      supervisorId: queue.supervisorId,
      typebotData: queue.typebotData,
      customerDepartmentChoice: queue.customerDepartmentChoice,
      customerOperatorChoice: queue.customerOperatorChoice,
      operatorAvailable: queue.operatorAvailable,
      createdAt: queue.queue_createdAt,
      typebotCompletedAt: queue.typebotCompletedAt,
      assignedAt: queue.assignedAt,
      completedAt: queue.completedAt,
      evolutionInstance: queue.evolutionInstance,
      typebotSessionUrl: queue.typebotSessionUrl,
      metadata: queue.queue_metadata,
    };

    const customerData = {
      id: queue.customer_id,
      remoteJid: queue.remoteJid,
      pushName: queue.pushName,
      profilePicUrl: queue.profilePicUrl,
      email: queue.email,
      cpf: queue.cpf,
      cnpj: queue.cnpj,
      priority: queue.priority,
      isGroup: queue.isGroup,
      isSaved: queue.isSaved,
      type: queue.type,
      status: queue.customer_status,
      createdAt: queue.customer_createdAt,
      updatedAt: queue.customer_updatedAt,
    };

    return { ...queueData, customer: customerData };
  }

  async startMostRecentQueueService(operatorId: string): Promise<QueueWithCustomer | null> {
    // Find the most recent waiting queue for this operator
    const queueWithCustomer = await this.findMostRecentWaitingQueue(operatorId);

    if (!queueWithCustomer) {
      return null;
    }

    // Check if the queue is still in waiting status
    if (queueWithCustomer.status !== QueueStatus.WAITING) {
      throw new Error('Queue is not in waiting status');
    }

    if (queueWithCustomer.assignedOperatorId) {
      throw new Error('Queue is already assigned to an operator');
    }

    // Pause typebot session if evolution instance is available
    if (queueWithCustomer.evolutionInstance && queueWithCustomer.customer.remoteJid) {
      try {
        await this.evolutionService.changeSessionStatus(queueWithCustomer.evolutionInstance, {
          remoteJid: queueWithCustomer.customer.remoteJid,
          status: 'paused'
        });
      } catch (error) {
        // Log error but don't fail the queue assignment
        console.error('Failed to pause typebot session:', error);
      }
    }

    // Update the queue to start service
    const updatedQueue = await this.updateQueue(queueWithCustomer.id, {
      status: QueueStatus.SERVICE,
      assignedOperatorId: operatorId,
      assignedAt: new Date()
    });

    if (!updatedQueue) {
      return null;
    }

    // Return the updated queue with customer information
    return this.findQueueWithCustomer(queueWithCustomer.id);
  }

  async transferQueueService(
    queueId: string,
    currentOperator: User,
    targetOperatorId: string
  ): Promise<QueueWithCustomer | null> {
    // First, check if the queue exists and is in service status
    const queue = await this.findQueueById(queueId);
    if (!queue) {
      return null;
    }

    if (queue.status !== QueueStatus.SERVICE) {
      throw new Error('Queue is not in service status');
    }

    if (queue.assignedOperatorId !== currentOperator.id) {
      throw new Error('Only the assigned operator can transfer this queue');
    }

    // Get target operator information
    const targetOperator = await this.knex('users')
      .where({ id: targetOperatorId })
      .first();

    if (!targetOperator) {
      throw new Error('Target operator not found');
    }

    // Update the queue to transfer to the new operator
    const updatedQueue = await this.updateQueue(queueId, {
      assignedOperatorId: targetOperatorId,
      assignedAt: new Date()
    });

    if (!updatedQueue) {
      return null;
    }

    // Get the updated queue with customer information
    const queueWithCustomer = await this.findQueueWithCustomer(queueId);

    // Send the transfer message
    try {
      const messageText = `Atendimento transferido para *${targetOperator.name}*`;
      const defaultInstance = this.configService.get<string>('EVOLUTION_API_INSTANCE') || '';

      await this.evolutionService.sendText(defaultInstance, {
        number: `${queueWithCustomer?.customer.remoteJid}@s.whatsapp.net`,
        text: messageText
      });
    } catch (error) {
      // Log error but don't fail the queue transfer
      console.error('Failed to send transfer message:', error);
    }

    // Emit socket event for queue transfer
    if (queueWithCustomer) {
      try {
        this.socketService.broadcastToAll({
          type: 'queue.transfer',
          data: {
            event: 'queue.transfer',
            queueId: queueId,
            previousOperatorId: currentOperator.id,
            previousOperatorName: currentOperator.name,
            newOperatorId: targetOperatorId,
            newOperatorName: targetOperator.name,
            customerId: queueWithCustomer.customer.id,
            customerPhone: queueWithCustomer.customer.remoteJid,
            timestamp: new Date()
          },
          target: 'all'
        });
      } catch (error) {
        // Log error but don't fail the queue transfer
        console.error('Failed to emit socket event for queue transfer:', error);
      }
    }

    return queueWithCustomer;
  }

  async getConversationHistory(remoteJid: string, includeMessages: boolean = true, includeOperators: boolean = true): Promise<Array<{
    queue: QueueWithCustomer;
    messages?: any[];
    operators?: {
      requestedOperator?: any;
      assignedOperator?: any;
      supervisor?: any;
    };
  }>> {
    // Find customer by remoteJid
    const customer = await this.customerService.findByRemoteJid(remoteJid.replace('@s.whatsapp.net', ''));
    if (!customer) {
      return [];
    }

    // Find all completed queues for this customer
    const completedQueues = await this.knex('queues')
      .join('customers', 'queues.customerId', 'customers.id')
      .where('queues.customerId', customer.id)
      .whereIn('queues.status', [QueueStatus.COMPLETED, QueueStatus.CANCELLED])
      .select(
        'queues.id as queue_id',
        'queues.sessionId',
        'queues.customerId',
        'queues.status as queue_status',
        'queues.department',
        'queues.direction',
        'queues.requestedOperatorId',
        'queues.assignedOperatorId',
        'queues.supervisorId',
        'queues.typebotData',
        'queues.customerDepartmentChoice',
        'queues.customerOperatorChoice',
        'queues.operatorAvailable',
        'queues.createdAt as queue_createdAt',
        'queues.typebotCompletedAt',
        'queues.assignedAt',
        'queues.completedAt',
        'queues.evolutionInstance',
        'queues.typebotSessionUrl',
        'queues.metadata as queue_metadata',
        'customers.id as customer_id',
        'customers.remoteJid',
        'customers.pushName',
        'customers.profilePicUrl',
        'customers.email',
        'customers.cpf',
        'customers.cnpj',
        'customers.priority',
        'customers.isGroup',
        'customers.isSaved',
        'customers.type',
        'customers.status as customer_status',
        'customers.createdAt as customer_createdAt',
        'customers.updatedAt as customer_updatedAt'
      )
      .orderBy('queues.createdAt', 'desc');

    // For each completed queue, get the messages and operator information if requested
    const history = await Promise.all(
      completedQueues.map(async (queue) => {
        // Separate queue and customer data
        const queueData = {
          id: queue.queue_id,
          sessionId: queue.sessionId,
          customerId: queue.customerId,
          status: queue.queue_status,
          department: queue.department,
          direction: queue.direction,
          requestedOperatorId: queue.requestedOperatorId,
          assignedOperatorId: queue.assignedOperatorId,
          supervisorId: queue.supervisorId,
          typebotData: queue.typebotData,
          customerDepartmentChoice: queue.customerDepartmentChoice,
          customerOperatorChoice: queue.customerOperatorChoice,
          operatorAvailable: queue.operatorAvailable,
          createdAt: queue.queue_createdAt,
          typebotCompletedAt: queue.typebotCompletedAt,
          assignedAt: queue.assignedAt,
          completedAt: queue.completedAt,
          evolutionInstance: queue.evolutionInstance,
          typebotSessionUrl: queue.typebotSessionUrl,
          metadata: queue.queue_metadata,
        };

        const customerData = {
          id: queue.customer_id,
          remoteJid: queue.remoteJid,
          pushName: queue.pushName,
          profilePicUrl: queue.profilePicUrl,
          email: queue.email,
          cpf: queue.cpf,
          cnpj: queue.cnpj,
          priority: queue.priority,
          isGroup: queue.isGroup,
          isSaved: queue.isSaved,
          type: queue.type,
          status: queue.customer_status,
          createdAt: queue.customer_createdAt,
          updatedAt: queue.customer_updatedAt,
        };

        const queueWithCustomer = { ...queueData, customer: customerData };

        // Get messages for this session only if requested, ordered by sentAt timestamp
        let messages: any[] = [];
        if (includeMessages) {
          messages = await this.knex('messages')
            .where({ sessionId: queue.sessionId })
            .orderBy('sentAt', 'asc')
            .select('*');
        }

        // Get operator information only if requested
        let operators: {
          requestedOperator?: any;
          assignedOperator?: any;
          supervisor?: any;
        } = {};

        if (includeOperators && (queue.requestedOperatorId || queue.assignedOperatorId || queue.supervisorId)) {
          const userIds = [
            queue.requestedOperatorId,
            queue.assignedOperatorId,
            queue.supervisorId
          ].filter(Boolean);

          if (userIds.length > 0) {
            const users = await this.knex('users')
              .whereIn('id', userIds)
              .select('id', 'name', 'login', 'email', 'department', 'profile', 'status');

            if (queue.requestedOperatorId) {
              operators.requestedOperator = users.find(u => u.id === queue.requestedOperatorId);
            }
            if (queue.assignedOperatorId) {
              operators.assignedOperator = users.find(u => u.id === queue.assignedOperatorId);
            }
            if (queue.supervisorId) {
              operators.supervisor = users.find(u => u.id === queue.supervisorId);
            }
          }
        }

        return {
          queue: queueWithCustomer,
          messages,
          operators
        };
      })
    );

    return history;
  }

  async findInactiveQueuesWithoutSessions(fifteenMinutesAgo: Date): Promise<Queue[]> {
    try {
      // Find queues that are in typebot status but have no active typebot session
      // and have been created more than 15 minutes ago
      const inactiveQueues = await this.knex('queues')
        .where('status', QueueStatus.TYPEBOT)
        .where('createdAt', '<', fifteenMinutesAgo)
        .select('*');

      return inactiveQueues;
    } catch (error) {
      this.logger.error('Error finding inactive queues without sessions:', error);
      return [];
    }
  }

  async findWaitingQueuesOlderThan(date: Date): Promise<Queue[]> {
    try {
      // Find queues that are in waiting status and have been created before the specified date
      const waitingQueues = await this.knex('queues')
        .where('status', QueueStatus.WAITING)
        .where('createdAt', '<', date)
        .select('*');

      return waitingQueues;
    } catch (error) {
      this.logger.error('Error finding waiting queues older than specified date:', error);
      return [];
    }
  }
} 