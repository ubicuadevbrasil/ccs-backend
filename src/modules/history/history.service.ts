import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { randomUUID } from 'crypto';
import { History, HistoryEntity, HistoryPlatform, HistoryDirection } from './entities/history.entity';
import { CreateHistoryDto, UpdateHistoryDto, HistoryQueryDto, HistoryListResponseDto, HistoryListItemDto } from './dto/history.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class HistoryService {
  constructor(@InjectKnex() private readonly knex: Knex) {}

  /**
   * Create a new history record
   */
  async createHistory(createHistoryDto: CreateHistoryDto): Promise<History> {
    // Validate foreign key references if provided
    if (createHistoryDto.userId) {
      const userExists = await this.knex('user')
        .where('id', createHistoryDto.userId)
        .first();
      
      if (!userExists) {
        throw new BadRequestException('User not found');
      }
    }

    if (createHistoryDto.customerId) {
      const customerExists = await this.knex('customer')
        .where('id', createHistoryDto.customerId)
        .first();
      
      if (!customerExists) {
        throw new BadRequestException('Customer not found');
      }
    }

    // Validate date consistency
    const startedAt = new Date(createHistoryDto.startedAt);
    const attendedAt = createHistoryDto.attendedAt ? new Date(createHistoryDto.attendedAt) : null;
    const finishedAt = createHistoryDto.finishedAt ? new Date(createHistoryDto.finishedAt) : null;

    if (attendedAt && attendedAt < startedAt) {
      throw new BadRequestException('AttendedAt cannot be before startedAt');
    }

    if (finishedAt && finishedAt < startedAt) {
      throw new BadRequestException('FinishedAt cannot be before startedAt');
    }

    if (attendedAt && finishedAt && finishedAt < attendedAt) {
      throw new BadRequestException('FinishedAt cannot be before attendedAt');
    }

    const [newHistory] = await this.knex('history')
      .insert({
        id: randomUUID(),
        ...createHistoryDto,
        startedAt,
        attendedAt,
        finishedAt,
        createdAt: this.knex.fn.now(),
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return new History(newHistory);
  }

  /**
   * Find all history records with pagination and filtering
   */
  async findAllHistory(query: HistoryQueryDto): Promise<HistoryListResponseDto> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    let queryBuilder = this.knex('history')
      .leftJoin('customer', 'history.customerId', 'customer.id')
      .leftJoin('user', 'history.userId', 'user.id');

    // Apply search filter - expanded to include customer name, donorCode, history donorCode, and user name
    if (query.search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .whereILike('history.sessionId', `%${query.search}%`)
          .orWhereILike('history.protocol', `%${query.search}%`)
          .orWhereILike('history.observations', `%${query.search}%`)
          .orWhereILike('history.donorCode', `%${query.search}%`)
          .orWhereILike('customer.name', `%${query.search}%`)
          .orWhereILike('customer.donorCode', `%${query.search}%`)
          .orWhereILike('user.name', `%${query.search}%`);
      });
    }

    // Apply user filter
    if (query.userId) {
      queryBuilder = queryBuilder.where('history.userId', query.userId);
    }

    // Apply customer filter
    if (query.customerId) {
      queryBuilder = queryBuilder.where('history.customerId', query.customerId);
    }

    // Apply protocol filter
    if (query.protocol) {
      queryBuilder = queryBuilder.where('history.protocol', query.protocol);
    }

    // Apply platform filter
    if (query.platform) {
      queryBuilder = queryBuilder.where('history.platform', query.platform);
    }

    // Apply direction filter
    if (query.direction) {
      queryBuilder = queryBuilder.where('history.direction', query.direction);
    }

    // Apply date range filters
    if (query.startDate) {
      queryBuilder = queryBuilder.where('history.startedAt', '>=', new Date(query.startDate));
    }

    if (query.endDate) {
      queryBuilder = queryBuilder.where('history.startedAt', '<=', new Date(query.endDate));
    }

    // Apply status filters
    if (query.isActive === 'true') {
      queryBuilder = queryBuilder.whereNull('history.finishedAt');
    } else if (query.isActive === 'false') {
      queryBuilder = queryBuilder.whereNotNull('history.finishedAt');
    }

    if (query.isAttended === 'true') {
      queryBuilder = queryBuilder.whereNotNull('history.attendedAt');
    } else if (query.isAttended === 'false') {
      queryBuilder = queryBuilder.whereNull('history.attendedAt');
    }

    if (query.isFinished === 'true') {
      queryBuilder = queryBuilder.whereNotNull('history.finishedAt');
    } else if (query.isFinished === 'false') {
      queryBuilder = queryBuilder.whereNull('history.finishedAt');
    }

    // Get total count
    const totalQuery = queryBuilder.clone();
    const [{ count }] = await totalQuery.countDistinct('history.id as count');
    const total = parseInt(count as string);

    // Get paginated history IDs first to avoid duplicates from joins
    const historyIdsQuery = queryBuilder.clone()
      .select('history.id', 'history.finishedAt', 'history.startedAt')
      .distinct('history.id', 'history.finishedAt', 'history.startedAt')
      .orderBy('history.finishedAt', 'desc')
      .orderBy('history.startedAt', 'desc')
      .limit(limit)
      .offset(offset);

    const historyIds = (await historyIdsQuery).map((row: any) => row.id);

    // Get full history records for the selected IDs
    const histories = historyIds.length > 0
      ? await this.knex('history')
          .whereIn('id', historyIds)
          .select(
            'id',
            'sessionId',
            'protocol',
            'platform',
            'direction',
            'donorCode',
            'observations',
            'startedAt',
            'attendedAt',
            'finishedAt',
            'customerId',
            'userId',
            'tabulationId'
          )
          .orderBy('finishedAt', 'desc')
          .orderBy('startedAt', 'desc')
      : [];

    // Get customer, user, and tabulation data for each history record
    const customerIds = [...new Set(histories.map(h => h.customerId).filter(Boolean))];
    const userIds = [...new Set(histories.map(h => h.userId).filter(Boolean))];
    const tabulationIds = [...new Set(histories.map(h => h.tabulationId).filter(Boolean))];

    // Fetch customers with their tags
    const customers = customerIds.length > 0
      ? await this.knex('customer')
          .whereIn('id', customerIds)
          .select('id', 'platformId', 'name', 'email', 'cpf', 'profilePicUrl as profilePicture', 'donorCode', 'observations')
      : [];

    // Fetch customer tags
    const customerTagsMap = new Map<string, string[]>();
    if (customerIds.length > 0) {
      const customerTags = await this.knex('customerTags')
        .whereIn('customerId', customerIds)
        .select('customerId', 'tag');

      customerTags.forEach(tag => {
        if (!customerTagsMap.has(tag.customerId)) {
          customerTagsMap.set(tag.customerId, []);
        }
        customerTagsMap.get(tag.customerId)!.push(tag.tag);
      });
    }

    // Fetch users
    const users = userIds.length > 0
      ? await this.knex('user')
          .whereIn('id', userIds)
          .select('id', 'name', 'profilePicture', 'email', 'contact')
      : [];

    // Fetch tabulations
    const tabulations = tabulationIds.length > 0
      ? await this.knex('tabulation')
          .whereIn('id', tabulationIds)
          .select('id', 'name', 'description', 'effective')
      : [];

    // Create maps for quick lookup
    const customerMap = new Map(customers.map(c => [c.id, c]));
    const userMap = new Map(users.map(u => [u.id, u]));
    const tabulationMap = new Map(tabulations.map(t => [t.id, t]));

    // Build response items
    const data: HistoryListItemDto[] = histories.map(history => {
      const customer = history.customerId ? customerMap.get(history.customerId) : undefined;
      const user = history.userId ? userMap.get(history.userId) : undefined;
      const tabulation = history.tabulationId ? tabulationMap.get(history.tabulationId) : undefined;
      const tags = history.customerId ? customerTagsMap.get(history.customerId) || [] : undefined;

      return {
        id: history.id,
        sessionId: history.sessionId,
        protocol: history.protocol,
        platform: history.platform,
        direction: history.direction,
        donorCode: history.donorCode,
        observations: history.observations,
        startedAt: history.startedAt,
        attendedAt: history.attendedAt,
        finishedAt: history.finishedAt,
        customer: customer ? {
          id: customer.id,
          platformId: customer.platformId,
          name: customer.name,
          email: customer.email,
          cpf: customer.cpf,
          profilePicture: customer.profilePicture,
          donorCode: customer.donorCode,
          observations: customer.observations,
          tags: tags,
        } : undefined,
        user: user ? {
          id: user.id,
          name: user.name,
          profilePicture: user.profilePicture,
          email: user.email,
          contact: user.contact,
        } : undefined,
        tabulation: tabulation ? {
          id: tabulation.id,
          name: tabulation.name,
          description: tabulation.description,
          effective: tabulation.effective,
        } : undefined,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find history by ID
   */
  async findHistoryById(id: string): Promise<any[]> {
    const history = await this.knex('history')
      .where('id', id)
      .first();

    if (!history) {
      throw new NotFoundException('History not found');
    }

    // Fetch messages from PostgreSQL with customer and user names
    const messages = await this.knex('messages')
      .leftJoin('customer', 'messages.customerId', 'customer.id')
      .leftJoin('user', 'messages.userId', 'user.id')
      .where('messages.sessionId', history.sessionId)
      .select(
        'messages.*',
        'customer.name as customerName',
        'user.name as userName'
      )
      .orderBy('messages.sentAt', 'asc');

    return messages;
  }

  /**
   * Find history by session ID
   */
  async findHistoryBySessionId(sessionId: string): Promise<any[]> {
    // Fetch messages from PostgreSQL for this session with customer and user names
    const messages = await this.knex('messages')
      .leftJoin('customer', 'messages.customerId', 'customer.id')
      .leftJoin('user', 'messages.userId', 'user.id')
      .where('messages.sessionId', sessionId)
      .select(
        'messages.*',
        'customer.name as customerName',
        'user.name as userName'
      )
      .orderBy('messages.sentAt', 'asc');

    return messages;
  }

  /**
   * Find active history by session ID
   */
  async findActiveHistoryBySessionId(sessionId: string): Promise<any[] | null> {
    const history = await this.knex('history')
      .where('sessionId', sessionId)
      .whereNull('finishedAt')
      .first();

    if (!history) {
      return null;
    }

    // Fetch messages from PostgreSQL with customer and user names
    const messages = await this.knex('messages')
      .leftJoin('customer', 'messages.customerId', 'customer.id')
      .leftJoin('user', 'messages.userId', 'user.id')
      .where('messages.sessionId', sessionId)
      .select(
        'messages.*',
        'customer.name as customerName',
        'user.name as userName'
      )
      .orderBy('messages.sentAt', 'asc');

    return messages;
  }

  /**
   * Update history by ID
   */
  async updateHistory(id: string, updateHistoryDto: UpdateHistoryDto): Promise<History> {
    // Check if history exists
    const existingHistory = await this.knex('history')
      .where('id', id)
      .first();

    if (!existingHistory) {
      throw new NotFoundException('History not found');
    }

    // Validate foreign key references if provided
    if (updateHistoryDto.userId) {
      const userExists = await this.knex('user')
        .where('id', updateHistoryDto.userId)
        .first();
      
      if (!userExists) {
        throw new BadRequestException('User not found');
      }
    }

    if (updateHistoryDto.customerId) {
      const customerExists = await this.knex('customer')
        .where('id', updateHistoryDto.customerId)
        .first();
      
      if (!customerExists) {
        throw new BadRequestException('Customer not found');
      }
    }

    // Validate date consistency
    const startedAt = updateHistoryDto.startedAt ? new Date(updateHistoryDto.startedAt) : existingHistory.startedAt;
    const attendedAt = updateHistoryDto.attendedAt ? new Date(updateHistoryDto.attendedAt) : existingHistory.attendedAt;
    const finishedAt = updateHistoryDto.finishedAt ? new Date(updateHistoryDto.finishedAt) : existingHistory.finishedAt;

    if (attendedAt && attendedAt < startedAt) {
      throw new BadRequestException('AttendedAt cannot be before startedAt');
    }

    if (finishedAt && finishedAt < startedAt) {
      throw new BadRequestException('FinishedAt cannot be before startedAt');
    }

    if (attendedAt && finishedAt && finishedAt < attendedAt) {
      throw new BadRequestException('FinishedAt cannot be before attendedAt');
    }

    const [updatedHistory] = await this.knex('history')
      .where('id', id)
      .update({
        ...updateHistoryDto,
        startedAt: updateHistoryDto.startedAt ? startedAt : undefined,
        attendedAt: updateHistoryDto.attendedAt ? attendedAt : undefined,
        finishedAt: updateHistoryDto.finishedAt ? finishedAt : undefined,
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return new History(updatedHistory);
  }

  /**
   * Delete history by ID
   */
  async deleteHistory(id: string): Promise<void> {
    const deletedRows = await this.knex('history')
      .where('id', id)
      .del();

    if (deletedRows === 0) {
      throw new NotFoundException('History not found');
    }
  }

  /**
   * Mark history as attended
   */
  async markAsAttended(id: string, attendedAt?: Date): Promise<History> {
    const history = await this.knex('history')
      .where('id', id)
      .first();

    if (!history) {
      throw new NotFoundException('History not found');
    }

    const attendedTime = attendedAt || new Date();

    if (attendedTime < history.startedAt) {
      throw new BadRequestException('AttendedAt cannot be before startedAt');
    }

    const [updatedHistory] = await this.knex('history')
      .where('id', id)
      .update({
        attendedAt: attendedTime,
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return new History(updatedHistory);
  }

  /**
   * Mark history as finished
   */
  async markAsFinished(id: string, finishedAt?: Date): Promise<History> {
    const history = await this.knex('history')
      .where('id', id)
      .first();

    if (!history) {
      throw new NotFoundException('History not found');
    }

    const finishedTime = finishedAt || new Date();

    if (finishedTime < history.startedAt) {
      throw new BadRequestException('FinishedAt cannot be before startedAt');
    }

    if (history.attendedAt && finishedTime < history.attendedAt) {
      throw new BadRequestException('FinishedAt cannot be before attendedAt');
    }

    const [updatedHistory] = await this.knex('history')
      .where('id', id)
      .update({
        finishedAt: finishedTime,
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return new History(updatedHistory);
  }

  /**
   * Get history statistics
   */
  async getHistoryStatistics(filters?: {
    userId?: string;
    customerId?: string;
    platform?: HistoryPlatform;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    total: number;
    active: number;
    attended: number;
    finished: number;
    averageDuration: number;
    averageAttendanceTime: number;
  }> {
    let queryBuilder = this.knex('history');

    if (filters?.userId) {
      queryBuilder = queryBuilder.where('userId', filters.userId);
    }

    if (filters?.customerId) {
      queryBuilder = queryBuilder.where('customerId', filters.customerId);
    }

    if (filters?.platform) {
      queryBuilder = queryBuilder.where('platform', filters.platform);
    }

    if (filters?.startDate) {
      queryBuilder = queryBuilder.where('startedAt', '>=', filters.startDate);
    }

    if (filters?.endDate) {
      queryBuilder = queryBuilder.where('startedAt', '<=', filters.endDate);
    }

    const histories = await queryBuilder.select('*');

    const total = histories.length;
    const active = histories.filter(h => !h.finishedAt).length;
    const attended = histories.filter(h => h.attendedAt).length;
    const finished = histories.filter(h => h.finishedAt).length;

    const finishedHistories = histories.filter(h => h.finishedAt);
    const averageDuration = finishedHistories.length > 0 
      ? finishedHistories.reduce((sum, h) => sum + (h.finishedAt.getTime() - h.startedAt.getTime()), 0) / finishedHistories.length
      : 0;

    const attendedHistories = histories.filter(h => h.attendedAt);
    const averageAttendanceTime = attendedHistories.length > 0
      ? attendedHistories.reduce((sum, h) => sum + (h.attendedAt.getTime() - h.startedAt.getTime()), 0) / attendedHistories.length
      : 0;

    return {
      total,
      active,
      attended,
      finished,
      averageDuration,
      averageAttendanceTime,
    };
  }
}
