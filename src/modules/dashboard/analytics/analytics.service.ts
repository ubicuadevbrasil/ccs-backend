import { Injectable, Logger } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { SocketGateway } from '../../socket/socket.gateway';
import { QueueService } from '../../customer-queue/queue.service';
import { QueueStatus } from '../../customer-queue/entities/queue.entity';
import {
  CardsMetricsResponseDto,
  OperatorResponseDto,
  OperatorsQueryDto,
  OperatorsResponseDto,
  ActiveServiceResponseDto,
  ActiveServicesQueryDto,
  ActiveServicesResponseDto,
  HistoryDirection,
} from './dto/analytics.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectKnex() private readonly knex: Knex,
    private readonly socketGateway: SocketGateway,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Get cards metrics for dashboard
   */
  async getCardsMetrics(): Promise<CardsMetricsResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get queue statistics
    const queueStats = await this.queueService.getQueueStatistics();

    // Get finished services today
    const finishedServicesResult = await this.knex('history')
      .whereNotNull('finishedAt')
      .whereRaw('DATE(??) = CURRENT_DATE', ['finishedAt'])
      .count('* as count')
      .first();
    const finishedServices = parseInt(finishedServicesResult?.count as string) || 0;

    // Get message statistics for today
    const receivedMessagesResult = await this.knex('messages')
      .where('fromMe', false)
      .whereRaw('DATE(??) = CURRENT_DATE', ['sentAt'])
      .count('* as count')
      .first();
    const receivedMessages = parseInt(receivedMessagesResult?.count as string) || 0;

    const sentMessagesResult = await this.knex('messages')
      .where('fromMe', true)
      .whereRaw('DATE(??) = CURRENT_DATE', ['sentAt'])
      .count('* as count')
      .first();
    const sentMessages = parseInt(sentMessagesResult?.count as string) || 0;

    const readMessagesResult = await this.knex('messages')
      .where('status', 'read')
      .whereRaw('DATE(??) = CURRENT_DATE', ['sentAt'])
      .count('* as count')
      .first();
    const readMessages = parseInt(readMessagesResult?.count as string) || 0;

    return {
      customersWaitingInQueue: queueStats.waiting,
      customersInService: queueStats.service,
      finishedServices,
      receivedMessages,
      sentMessages,
      readMessages,
      total: receivedMessages + sentMessages,
    };
  }

  /**
   * Get operators with pagination and filtering
   */
  async getOperators(query: OperatorsQueryDto): Promise<OperatorsResponseDto> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    // Get connected user IDs and their connection timestamps
    const connectedUserIds = this.socketGateway.getConnectedUsers();
    const connectionTimestamps = this.socketGateway.getAllConnectedUsersWithTimestamps();

    // Build query for users
    let queryBuilder = this.knex('user');

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .whereILike('name', `%${query.search}%`)
          .orWhereILike('email', `%${query.search}%`)
          .orWhereILike('contact', `%${query.search}%`);
      });
    }

    // Filter only connected users
    if (connectedUserIds.length > 0) {
      queryBuilder = queryBuilder.whereIn('id', connectedUserIds);
    } else {
      // If no connected users, return empty result
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Get total count
    const totalQuery = queryBuilder.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    // Get paginated results
    const users = await queryBuilder
      .select('*')
      .orderBy('lastActivityAt', 'desc')
      .limit(limit)
      .offset(offset);

    // Build operator response with additional data
    const operators: OperatorResponseDto[] = await Promise.all(
      users.map(async (user) => {
        const connectionTime = connectionTimestamps.get(user.id);
        const socketOnlineTime = connectionTime
          ? Date.now() - connectionTime.getTime()
          : 0;

        // Get socket ID
        const socketId = this.socketGateway.getSocketId(user.id) || '';

        // Get customers in service for this user from queue
        // We need to query the queue service for services with this userId
        const queueQuery = {
          userId: user.id,
          status: QueueStatus.SERVICE,
          page: '1',
          limit: '1000',
        };
        const userServices = await this.queueService.findAllQueue(queueQuery as any);
        const customersInService = userServices.data.length;

        // Get finished services for this user today
        const finishedServicesResult = await this.knex('history')
          .where('userId', user.id)
          .whereNotNull('finishedAt')
          .whereRaw('DATE(??) = CURRENT_DATE', ['finishedAt'])
          .count('* as count')
          .first();
        const finishedServices = parseInt(finishedServicesResult?.count as string) || 0;

        return {
          socketId,
          socketOnlineTime,
          userId: user.id,
          userName: user.name,
          userEmail: user.email || '',
          userContact: user.contact || '',
          userAvatar: user.profilePicture || '',
          userLoginAt: user.loginAt || null,
          userLogoutAt: user.logoutAt || null,
          userLastActivityAt: user.lastActivityAt || null,
          customersInService,
          finishedServices,
        };
      }),
    );

    return {
      data: operators,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get active services with pagination and filtering
   */
  async getActiveServices(query: ActiveServicesQueryDto): Promise<ActiveServicesResponseDto> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    // Get all sessionIds from queue with status='service'
    const serviceSessionIds = await this.queueService.getSessionIdsByStatus(QueueStatus.SERVICE);

    if (serviceSessionIds.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Build query with joins
    let queryBuilder = this.knex('history')
      .leftJoin('customer', 'history.customerId', 'customer.id')
      .leftJoin('user', 'history.userId', 'user.id')
      .whereIn('history.sessionId', serviceSessionIds)
      .select(
        'history.protocol',
        'history.sessionId',
        'history.direction',
        'history.attendedAt',
        'customer.name as customerName',
        'customer.contact as customerNumber',
        'customer.donorCode',
        'user.name as operatorName',
      );

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .whereILike('history.protocol', `%${query.search}%`)
          .orWhereILike('customer.name', `%${query.search}%`)
          .orWhereILike('customer.contact', `%${query.search}%`);
      });
    }

    // Apply direction filter
    if (query.direction) {
      queryBuilder = queryBuilder.where('history.direction', query.direction);
    }

    // Get total count
    const totalQuery = queryBuilder.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    // Get paginated results
    const services = await queryBuilder
      .orderBy('history.attendedAt', 'desc')
      .limit(limit)
      .offset(offset);

    const activeServices: ActiveServiceResponseDto[] = services.map((service) => ({
      protocol: service.protocol || null,
      sessionId: service.sessionId,
      customerName: service.customerName || null,
      customerNumber: service.customerNumber || null,
      donorCode: service.donorCode || null,
      operatorName: service.operatorName || null,
      direction: service.direction as HistoryDirection,
      attendedAt: service.attendedAt || null,
    }));

    return {
      data: activeServices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

