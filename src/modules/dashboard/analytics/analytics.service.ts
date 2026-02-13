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

    const avgWaitingQueueTimeSeconds = queueStats.averageWaitingTime > 0
      ? Math.round((queueStats.averageWaitingTime / 1000) * 100) / 100
      : null;
    const avgServiceTimeResult = await this.knex('history')
      .whereNotNull('attendedAt')
      .whereNotNull('finishedAt')
      .whereRaw('DATE(??) = CURRENT_DATE', ['finishedAt'])
      .select(this.knex.raw('AVG(EXTRACT(EPOCH FROM ("finishedAt" - "attendedAt"))) as "avgSeconds"'))
      .first();
    const avgServiceTimeSeconds =
      avgServiceTimeResult?.avgSeconds != null && Number(avgServiceTimeResult.avgSeconds) > 0
        ? Math.round(Number(avgServiceTimeResult.avgSeconds) * 100) / 100
        : null;

    return {
      customersWaitingInQueue: queueStats.waiting,
      customersInService: queueStats.service,
      finishedServices,
      receivedMessages,
      sentMessages,
      readMessages,
      total: receivedMessages + sentMessages,
      avgWaitingQueueTimeSeconds,
      avgServiceTimeSeconds,
    };
  }

  /**
   * Get operators with pagination and filtering.
   * Includes socket-connected users (excluding current auth user) and recently disconnected
   * (lastActivity within 30 min). Excludes users who have logged out (logoutAt set).
   */
  async getOperators(query: OperatorsQueryDto, currentUserId: string): Promise<OperatorsResponseDto> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    const RECENT_DISCONNECT_MINUTES = 30;
    const recentCutoff = new Date(Date.now() - RECENT_DISCONNECT_MINUTES * 60 * 1000);

    const connectedUserIds = this.socketGateway.getConnectedUsers();
    const connectionTimestamps = this.socketGateway.getAllConnectedUsersWithTimestamps();

    let queryBuilder = this.knex('user')
      .whereNull('logoutAt')
      .where('id', '!=', currentUserId)
      .where((builder) => {
        if (connectedUserIds.length > 0) {
          builder.whereIn('id', connectedUserIds).orWhere('lastActivityAt', '>=', recentCutoff);
        } else {
          builder.where('lastActivityAt', '>=', recentCutoff);
        }
      });

    if (query.search) {
      queryBuilder = queryBuilder.andWhere((builder) => {
        builder
          .whereILike('name', `%${query.search}%`)
          .orWhereILike('email', `%${query.search}%`)
          .orWhereILike('contact', `%${query.search}%`);
      });
    }

    const totalQuery = queryBuilder.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    const users = await queryBuilder
      .select('*')
      .orderBy('lastActivityAt', 'desc')
      .limit(limit)
      .offset(offset);

    const operators: OperatorResponseDto[] = await Promise.all(
      users.map(async (user) => {
        const isConnected = connectedUserIds.includes(user.id);
        const connectionTime = connectionTimestamps.get(user.id);
        const socketOnlineTime = connectionTime
          ? Date.now() - connectionTime.getTime()
          : 0;
        const socketId = this.socketGateway.getSocketId(user.id) || '';

        const queueQuery = {
          userId: user.id,
          status: QueueStatus.SERVICE,
          page: '1',
          limit: '1000',
        };
        const userServices = await this.queueService.findAllQueue(queueQuery as any);
        const customersInService = userServices.data.length;

        const finishedServicesResult = await this.knex('history')
          .where('userId', user.id)
          .whereNotNull('finishedAt')
          .whereRaw('DATE(??) = CURRENT_DATE', ['finishedAt'])
          .count('* as count')
          .first();
        const finishedServices = parseInt(finishedServicesResult?.count as string) || 0;

        return {
          isConnected,
          socketId,
          socketOnlineTime,
          userId: user.id,
          userProfile: user.profile ?? 'operator',
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
   * Get active queues (waiting + service) from Redis with pagination and filtering
   */
  async getActiveServices(query: ActiveServicesQueryDto): Promise<ActiveServicesResponseDto> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    const queueQuery = { page: '1', limit: '5000' };
    const [waitingResult, serviceResult] = await Promise.all([
      this.queueService.findAllQueue({ ...queueQuery, status: QueueStatus.WAITING }),
      this.queueService.findAllQueue({ ...queueQuery, status: QueueStatus.SERVICE }),
    ]);

    let items = [...waitingResult.data, ...serviceResult.data];
    const searchLower = query.search?.toLowerCase();
    if (searchLower) {
      items = items.filter(
        (q) =>
          (q.sessionId && q.sessionId.toLowerCase().includes(searchLower)) ||
          (q.customer?.name && q.customer.name.toLowerCase().includes(searchLower)) ||
          (q.customer?.contact && q.customer.contact.toLowerCase().includes(searchLower)) ||
          (q.metadata?.protocol && String(q.metadata.protocol).toLowerCase().includes(searchLower)),
      );
    }
    if (query.direction) {
      items = items.filter((q) => (q.metadata?.direction ?? HistoryDirection.INBOUND) === query.direction);
    }

    items.sort((a, b) => {
      const aTime = a.attendedAt?.getTime() ?? 0;
      const bTime = b.attendedAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    const total = items.length;
    const paginated = items.slice(offset, offset + limit);

    const activeServices: ActiveServiceResponseDto[] = paginated.map((q) => {
      const cust = q.customer;
      const tags = cust?.tags;
      const tagsList = Array.isArray(tags)
        ? (tags as Array<{ tag?: string }>).map((t) => (typeof t === 'string' ? t : t?.tag)).filter(Boolean) as string[]
        : [];
      const customerDto: ActiveServiceResponseDto['customer'] = cust
        ? {
            id: cust.id,
            platformId: cust.platformId,
            name: cust.name ?? undefined,
            email: cust.email ?? undefined,
            cpf: cust.cpf ?? undefined,
            profilePicture: (cust as { profilePicture?: string }).profilePicture ?? (cust as { profilePicUrl?: string }).profilePicUrl ?? undefined,
            donorCode: cust.donorCode ?? undefined,
            observations: cust.observations ?? undefined,
            tags: tagsList,
          }
        : null;
      const usr = q.user;
      const userDto: ActiveServiceResponseDto['user'] = usr
        ? {
            id: usr.id,
            name: usr.name ?? undefined,
            profilePicture: usr.profilePicture ?? undefined,
            email: usr.email ?? undefined,
            contact: usr.contact ?? undefined,
          }
        : null;
      return {
        protocol: (q.metadata?.protocol as string) ?? null,
        sessionId: q.sessionId,
        customer: customerDto,
        user: userDto,
        direction: (q.metadata?.direction as HistoryDirection) ?? HistoryDirection.INBOUND,
        startedAt: q.createdAt ?? null,
        attendedAt: q.attendedAt ?? null,
      };
    });

    return {
      data: activeServices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

