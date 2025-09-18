import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Queue, QueueEntity, QueueStatus } from './entities/queue.entity';
import { CreateQueueDto, UpdateQueueDto, QueueQueryDto, EndServiceDto } from './dto/queue.dto';
import { HistoryService } from '../history/history.service';
import { HistoryPlatform } from '../history/entities/history.entity';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class QueueService {
  private readonly redis: Redis;
  private readonly QUEUE_KEY_PREFIX = 'queue:';
  private readonly QUEUE_INDEX_KEY = 'queue:index';

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly historyService: HistoryService,
  ) {
    this.redis = redisClient;
  }

  /**
   * Check if customer is already in queue
   */
  async isCustomerInQueue(customerId: string): Promise<boolean> {
    // Get all queue keys and check for customer
    const allSessionIds = await this.redis.zrevrange(this.QUEUE_INDEX_KEY, 0, -1);
    
    for (const sessionId of allSessionIds) {
      const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
      const queueData = await this.redis.hgetall(queueKey);
      
      if (Object.keys(queueData).length > 0 && 
          queueData.customerId === customerId && 
          queueData.status === QueueStatus.WAITING) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if customer is in service
   */
  async isCustomerInService(customerId: string): Promise<boolean> {
    // Get all queue keys and check for customer
    const allSessionIds = await this.redis.zrevrange(this.QUEUE_INDEX_KEY, 0, -1);
    
    for (const sessionId of allSessionIds) {
      const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
      const queueData = await this.redis.hgetall(queueKey);
      
      if (Object.keys(queueData).length > 0 && 
          queueData.customerId === customerId && 
          queueData.status === QueueStatus.SERVICE) {
        return true;
      }
    }
    return false;
  }

  /**
   * Create new queue entry when customer is not in queue
   */
  async createQueueEntry(createQueueDto: CreateQueueDto): Promise<Queue> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${createQueueDto.sessionId}`;
    
    // Check if queue item already exists
    const exists = await this.redis.exists(queueKey);
    if (exists) {
      throw new ConflictException('Customer is already in queue');
    }

    const queueData: QueueEntity = {
      sessionId: createQueueDto.sessionId,
      customerId: createQueueDto.customerId,
      userId: createQueueDto.userId,
      platform: createQueueDto.platform,
      status: QueueStatus.WAITING,
      createdAt: new Date(),
      attendedAt: createQueueDto.attendedAt ? new Date(createQueueDto.attendedAt) : undefined,
    };

    // Store in Redis
    await this.redis.hset(queueKey, this.serializeQueueData(queueData));
    
    // Add to index for pagination
    await this.redis.zadd(this.QUEUE_INDEX_KEY, Date.now(), createQueueDto.sessionId);

    return new Queue(queueData);
  }

  /**
   * Create a new queue item (legacy method for backward compatibility)
   */
  async createQueue(createQueueDto: CreateQueueDto): Promise<Queue> {
    return this.createQueueEntry(createQueueDto);
  }

  /**
   * Find all queue items with pagination and filtering
   */
  async findAllQueue(query: QueueQueryDto): Promise<PaginatedResult<Queue>> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    // Get all session IDs from index
    const allSessionIds = await this.redis.zrevrange(this.QUEUE_INDEX_KEY, 0, -1);
    
    let filteredSessionIds = allSessionIds;

    // Apply filters
    if (query.search || query.userId || query.customerId || query.platform || query.status || query.startDate || query.endDate) {
      const queueItems: Queue[] = [];
      
      for (const sessionId of allSessionIds) {
        const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
        const queueData = await this.redis.hgetall(queueKey);
        
        if (Object.keys(queueData).length === 0) {
          // Clean up orphaned index entries
          await this.redis.zrem(this.QUEUE_INDEX_KEY, sessionId);
          continue;
        }

        const queue = new Queue(this.deserializeQueueData(queueData));
        
        // Apply filters
        if (query.search && !queue.sessionId.includes(query.search)) {
          continue;
        }
        
        if (query.userId && queue.userId !== query.userId) {
          continue;
        }
        
        if (query.customerId && queue.customerId !== query.customerId) {
          continue;
        }
        
        if (query.platform && queue.platform !== query.platform) {
          continue;
        }
        
        if (query.status && queue.status !== query.status) {
          continue;
        }
        
        if (query.startDate && queue.createdAt < new Date(query.startDate)) {
          continue;
        }
        
        if (query.endDate && queue.createdAt > new Date(query.endDate)) {
          continue;
        }

        queueItems.push(queue);
      }

      filteredSessionIds = queueItems.map(q => q.sessionId);
    }

    const total = filteredSessionIds.length;
    const paginatedSessionIds = filteredSessionIds.slice(offset, offset + limit);

    // Get queue items
    const queueItems: Queue[] = [];
    for (const sessionId of paginatedSessionIds) {
      const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
      const queueData = await this.redis.hgetall(queueKey);
      
      if (Object.keys(queueData).length > 0) {
        queueItems.push(new Queue(this.deserializeQueueData(queueData)));
      }
    }

    return {
      data: queueItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find queue by session ID
   */
  async findQueueBySessionId(sessionId: string): Promise<Queue> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
    const queueData = await this.redis.hgetall(queueKey);

    if (Object.keys(queueData).length === 0) {
      throw new NotFoundException('Queue item not found');
    }

    return new Queue(this.deserializeQueueData(queueData));
  }

  /**
   * Find queue by customer ID
   */
  async findQueueByCustomerId(customerId: string): Promise<Queue> {
    // Find existing queue by customer ID
    const allSessionIds = await this.redis.zrevrange(this.QUEUE_INDEX_KEY, 0, -1);
    
    for (const sessionId of allSessionIds) {
      const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
      const queueData = await this.redis.hgetall(queueKey);
      
      if (Object.keys(queueData).length > 0 && queueData.customerId === customerId) {
        return new Queue(this.deserializeQueueData(queueData));
      }
    }

    throw new NotFoundException('Queue item not found');
  }

  /**
   * Update queue by session ID
   */
  async updateQueue(sessionId: string, updateQueueDto: UpdateQueueDto): Promise<Queue> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
    
    // Check if queue exists
    const exists = await this.redis.exists(queueKey);
    if (!exists) {
      throw new NotFoundException('Queue item not found');
    }

    // Get current data
    const currentData = await this.redis.hgetall(queueKey);
    const currentQueue = new Queue(this.deserializeQueueData(currentData));

    // Prepare update data
    const updateData: Partial<QueueEntity> = {};
    
    if (updateQueueDto.customerId !== undefined) {
      updateData.customerId = updateQueueDto.customerId;
    }
    
    if (updateQueueDto.userId !== undefined) {
      updateData.userId = updateQueueDto.userId;
    }
    
    if (updateQueueDto.platform !== undefined) {
      updateData.platform = updateQueueDto.platform;
    }
    
    if (updateQueueDto.status !== undefined) {
      updateData.status = updateQueueDto.status;
    }
    
    if (updateQueueDto.attendedAt !== undefined) {
      updateData.attendedAt = updateQueueDto.attendedAt ? new Date(updateQueueDto.attendedAt) : undefined;
    }

    // Merge with current data
    const updatedQueueData: QueueEntity = {
      ...currentQueue,
      ...updateData,
    };

    // Update in Redis
    await this.redis.hset(queueKey, this.serializeQueueData(updatedQueueData));

    return new Queue(updatedQueueData);
  }

  /**
   * Assign customer to agent (move from waiting to service)
   */
  async assignToAgent(sessionId: string, userId: string): Promise<Queue> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
    
    // Check if queue exists
    const exists = await this.redis.exists(queueKey);
    if (!exists) {
      throw new NotFoundException('Queue entry not found');
    }

    // Get current data
    const currentData = await this.redis.hgetall(queueKey);
    const currentQueue = new Queue(this.deserializeQueueData(currentData));

    // Update queue status
    const updatedQueueData: QueueEntity = {
      ...currentQueue,
      status: QueueStatus.SERVICE,
      userId,
      attendedAt: new Date(),
    };

    // Update in Redis
    await this.redis.hset(queueKey, this.serializeQueueData(updatedQueueData));

    return new Queue(updatedQueueData);
  }

  /**
   * Delete queue by session ID
   */
  async deleteQueue(sessionId: string): Promise<void> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
    
    // Check if queue exists
    const exists = await this.redis.exists(queueKey);
    if (!exists) {
      throw new NotFoundException('Queue item not found');
    }

    // Get queue data before deletion for real-time update
    const queueData = await this.redis.hgetall(queueKey);
    const queue = new Queue(this.deserializeQueueData(queueData));

    // Delete from Redis
    await this.redis.del(queueKey);
    
    // Remove from index
    await this.redis.zrem(this.QUEUE_INDEX_KEY, sessionId);
  }

  /**
   * Complete service and move to history
   */
  async completeService(endServiceDto: EndServiceDto): Promise<void> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${endServiceDto.sessionId}`;
    
    // Get queue data
    const queueData = await this.redis.hgetall(queueKey);
    if (Object.keys(queueData).length === 0) {
      throw new NotFoundException('Queue entry not found');
    }

    const queue = new Queue(this.deserializeQueueData(queueData));

    // Create history record
    await this.historyService.createHistory({
      sessionId: queue.sessionId,
      userId: queue.userId,
      customerId: queue.customerId,
      tabulationId: endServiceDto.tabulationId,
      observations: endServiceDto.observations,
      platform: queue.platform,
      startedAt: queue.createdAt.toISOString(),
      attendedAt: queue.attendedAt?.toISOString(),
      finishedAt: new Date().toISOString(),
    });

    // Delete from queue
    await this.deleteQueue(endServiceDto.sessionId);
  }

  /**
   * End service - create history record and delete from queue (legacy method)
   */
  async endService(endServiceDto: EndServiceDto): Promise<void> {
    return this.completeService(endServiceDto);
  }

  /**
   * Mark queue as attended
   */
  async markAsAttended(sessionId: string, attendedAt?: Date): Promise<Queue> {
    const attendedTime = attendedAt || new Date();
    
    return this.updateQueue(sessionId, {
      sessionId,
      status: QueueStatus.SERVICE,
      attendedAt: attendedTime.toISOString(),
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics(): Promise<{
    total: number;
    bot: number;
    waiting: number;
    service: number;
    averageWaitingTime: number;
  }> {
    const allSessionIds = await this.redis.zrevrange(this.QUEUE_INDEX_KEY, 0, -1);
    
    let total = 0;
    let bot = 0;
    let waiting = 0;
    let service = 0;
    let totalWaitingTime = 0;
    let attendedCount = 0;

    for (const sessionId of allSessionIds) {
      const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
      const queueData = await this.redis.hgetall(queueKey);
      
      if (Object.keys(queueData).length === 0) {
        await this.redis.zrem(this.QUEUE_INDEX_KEY, sessionId);
        continue;
      }

      const queue = new Queue(this.deserializeQueueData(queueData));
      total++;

      switch (queue.status) {
        case QueueStatus.BOT:
          bot++;
          break;
        case QueueStatus.WAITING:
          waiting++;
          break;
        case QueueStatus.SERVICE:
          service++;
          break;
      }

      if (queue.attendedAt) {
        totalWaitingTime += queue.waitingTime || 0;
        attendedCount++;
      }
    }

    return {
      total,
      bot,
      waiting,
      service,
      averageWaitingTime: attendedCount > 0 ? totalWaitingTime / attendedCount : 0,
    };
  }

  /**
   * Serialize queue data for Redis storage
   */
  private serializeQueueData(queue: QueueEntity): Record<string, string> {
    return {
      sessionId: queue.sessionId,
      customerId: queue.customerId,
      userId: queue.userId,
      platform: queue.platform,
      status: queue.status,
      createdAt: queue.createdAt.toISOString(),
      attendedAt: queue.attendedAt?.toISOString() || '',
    };
  }

  /**
   * Deserialize queue data from Redis
   */
  private deserializeQueueData(data: Record<string, string>): QueueEntity {
    return {
      sessionId: data.sessionId,
      customerId: data.customerId,
      userId: data.userId,
      platform: data.platform as HistoryPlatform,
      status: data.status as QueueStatus,
      createdAt: new Date(data.createdAt),
      attendedAt: data.attendedAt ? new Date(data.attendedAt) : undefined,
    };
  }
}
