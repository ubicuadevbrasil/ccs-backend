import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { History, HistoryEntity, HistoryPlatform } from './entities/history.entity';
import { CreateHistoryDto, UpdateHistoryDto, HistoryQueryDto } from './dto/history.dto';

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

    if (createHistoryDto.tabulationId) {
      const tabulationExists = await this.knex('tabulation')
        .where('id', createHistoryDto.tabulationId)
        .first();
      
      if (!tabulationExists) {
        throw new BadRequestException('Tabulation not found');
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
  async findAllHistory(query: HistoryQueryDto): Promise<PaginatedResult<History>> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    let queryBuilder = this.knex('history');

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .whereILike('sessionId', `%${query.search}%`)
          .orWhereILike('observations', `%${query.search}%`);
      });
    }

    // Apply user filter
    if (query.userId) {
      queryBuilder = queryBuilder.where('userId', query.userId);
    }

    // Apply customer filter
    if (query.customerId) {
      queryBuilder = queryBuilder.where('customerId', query.customerId);
    }

    // Apply tabulation filter
    if (query.tabulationId) {
      queryBuilder = queryBuilder.where('tabulationId', query.tabulationId);
    }

    // Apply platform filter
    if (query.platform) {
      queryBuilder = queryBuilder.where('platform', query.platform);
    }

    // Apply date range filters
    if (query.startDate) {
      queryBuilder = queryBuilder.where('startedAt', '>=', new Date(query.startDate));
    }

    if (query.endDate) {
      queryBuilder = queryBuilder.where('startedAt', '<=', new Date(query.endDate));
    }

    // Apply status filters
    if (query.isActive === 'true') {
      queryBuilder = queryBuilder.whereNull('finishedAt');
    } else if (query.isActive === 'false') {
      queryBuilder = queryBuilder.whereNotNull('finishedAt');
    }

    if (query.isAttended === 'true') {
      queryBuilder = queryBuilder.whereNotNull('attendedAt');
    } else if (query.isAttended === 'false') {
      queryBuilder = queryBuilder.whereNull('attendedAt');
    }

    if (query.isFinished === 'true') {
      queryBuilder = queryBuilder.whereNotNull('finishedAt');
    } else if (query.isFinished === 'false') {
      queryBuilder = queryBuilder.whereNull('finishedAt');
    }

    // Get total count
    const totalQuery = queryBuilder.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    // Get paginated results
    const histories = await queryBuilder
      .select('*')
      .orderBy('startedAt', 'desc')
      .limit(limit)
      .offset(offset);

    const historyEntities = histories.map(history => new History(history));

    return {
      data: historyEntities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find history by ID
   */
  async findHistoryById(id: string): Promise<History> {
    const history = await this.knex('history')
      .where('id', id)
      .first();

    if (!history) {
      throw new NotFoundException('History not found');
    }

    return new History(history);
  }

  /**
   * Find history by session ID
   */
  async findHistoryBySessionId(sessionId: string): Promise<History[]> {
    const histories = await this.knex('history')
      .where('sessionId', sessionId)
      .select('*')
      .orderBy('startedAt', 'desc');

    return histories.map(history => new History(history));
  }

  /**
   * Find active history by session ID
   */
  async findActiveHistoryBySessionId(sessionId: string): Promise<History | null> {
    const history = await this.knex('history')
      .where('sessionId', sessionId)
      .whereNull('finishedAt')
      .first();

    return history ? new History(history) : null;
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

    if (updateHistoryDto.tabulationId) {
      const tabulationExists = await this.knex('tabulation')
        .where('id', updateHistoryDto.tabulationId)
        .first();
      
      if (!tabulationExists) {
        throw new BadRequestException('Tabulation not found');
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
