import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Queue, QueueEntity, QueueStatus } from './entities/queue.entity';
import { 
  CreateQueueDto, 
  UpdateQueueDto, 
  QueueQueryDto, 
  EndServiceDto,
  CreateQueueWhatsAppDto,
  CreateQueueTelegramDto,
  CreateQueueInstagramDto,
  CreateQueueFacebookDto
} from './dto/queue.dto';
import { HistoryService } from '../history/history.service';
import { HistoryPlatform } from '../history/entities/history.entity';
import { Customer } from '../customer/entities/customer.entity';
import { User } from '../user/entities/user.entity';
import { Message } from '../messages/entities/message.entity';
import { UserService } from '../user/user.service';

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
    private readonly userService: UserService,
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
  async createQueue(createQueueDto: CreateQueueDto): Promise<Queue> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${createQueueDto.sessionId}`;
    
    // Check if queue item already exists
    const exists = await this.redis.exists(queueKey);
    if (exists) {
      throw new ConflictException('Customer is already in queue');
    }

    const queueData: QueueEntity = {
      sessionId: createQueueDto.sessionId,
      customerId: createQueueDto.customerId,
      customer: createQueueDto.customer,
      userId: createQueueDto.userId,
      user: createQueueDto.user,
      platform: createQueueDto.platform,
      status: QueueStatus.WAITING,
      createdAt: new Date(),
      attendedAt: createQueueDto.attendedAt ? new Date(createQueueDto.attendedAt) : undefined,
      lastMessage: createQueueDto.lastMessage,
      metadata: createQueueDto.metadata,
    };

    // Store in Redis
    await this.redis.hset(queueKey, this.serializeQueueData(queueData));
    
    // Add to index for pagination
    await this.redis.zadd(this.QUEUE_INDEX_KEY, Date.now(), createQueueDto.sessionId);

    return new Queue(queueData);
  }

  /**
   * Create WhatsApp-specific queue entry
   */
  async createQueueWhatsApp(createQueueDto: CreateQueueWhatsAppDto): Promise<Queue> {
    const queueData: CreateQueueDto = {
      sessionId: createQueueDto.sessionId,
      customerId: createQueueDto.customerId,
      customer: createQueueDto.customer,
      userId: createQueueDto.userId,
      user: createQueueDto.user,
      platform: HistoryPlatform.WHATSAPP,
      status: QueueStatus.BOT,
      attendedAt: createQueueDto.attendedAt,
      lastMessage: createQueueDto.lastMessage,
      metadata: createQueueDto.metadata,
    };

    const queue = await this.createQueue(queueData);
    return queue;
  }

  /**
   * Create Telegram-specific queue entry
   */
  async createQueueTelegram(createQueueDto: CreateQueueTelegramDto): Promise<Queue> {
    const queueData: CreateQueueDto = {
      sessionId: createQueueDto.sessionId,
      customerId: createQueueDto.customerId,
      customer: createQueueDto.customer,
      userId: createQueueDto.userId,
      user: createQueueDto.user,
      platform: HistoryPlatform.TELEGRAM,
      status: QueueStatus.BOT,
      attendedAt: createQueueDto.attendedAt,
      lastMessage: createQueueDto.lastMessage,
      metadata: createQueueDto.metadata,
    };

    const queue = await this.createQueue(queueData);
    return queue;
  }

  /**
   * Create Instagram-specific queue entry
   */
  async createQueueInstagram(createQueueDto: CreateQueueInstagramDto): Promise<Queue> {
    const queueData: CreateQueueDto = {
      sessionId: createQueueDto.sessionId,
      customerId: createQueueDto.customerId,
      customer: createQueueDto.customer,
      userId: createQueueDto.userId,
      user: createQueueDto.user,
      platform: HistoryPlatform.INSTAGRAM,
      status: QueueStatus.BOT,
      attendedAt: createQueueDto.attendedAt,
      lastMessage: createQueueDto.lastMessage,
      metadata: createQueueDto.metadata,
    };

    const queue = await this.createQueue(queueData);
    return queue;
  }

  /**
   * Create Facebook-specific queue entry
   */
  async createQueueFacebook(createQueueDto: CreateQueueFacebookDto): Promise<Queue> {
    const queueData: CreateQueueDto = {
      sessionId: createQueueDto.sessionId,
      customerId: createQueueDto.customerId,
      customer: createQueueDto.customer,
      userId: createQueueDto.userId,
      user: createQueueDto.user,
      platform: HistoryPlatform.FACEBOOK,
      status: QueueStatus.BOT,
      attendedAt: createQueueDto.attendedAt,
      lastMessage: createQueueDto.lastMessage,
      metadata: createQueueDto.metadata,
    };

    const queue = await this.createQueue(queueData);
    return queue;
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
  async markAsAttended(sessionId: string, userId?: string, user?: User, attendedAt?: Date): Promise<Queue> {
    const attendedTime = attendedAt || new Date();
    
    const updateData: any = {
      sessionId,
      status: QueueStatus.SERVICE,
      attendedAt: attendedTime.toISOString(),
    };

    // Update user information if provided
    if (userId) {
      updateData.userId = userId;
    }
    if (user) {
      updateData.user = user;
    }
    
    return this.updateQueue(sessionId, updateData);
  }

  /**
   * Transfer queue to another user
   */
  async transferQueue(sessionId: string, targetUserId: string): Promise<Queue> {
    // Get the target user information
    const targetUser = await this.userService.findUserById(targetUserId);
    
    // Update the queue with the new user information
    const updateData = {
      sessionId,
      userId: targetUserId,
      user: targetUser,
    };
    
    return this.updateQueue(sessionId, updateData);
  }

  /**
   * Update queue with latest message
   */
  async updateLastMessage(sessionId: string, lastMessage: Message): Promise<Queue> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
    
    // Check if queue exists
    const exists = await this.redis.exists(queueKey);
    if (!exists) {
      throw new NotFoundException('Queue entry not found');
    }

    // Get current data
    const currentData = await this.redis.hgetall(queueKey);
    const currentQueue = new Queue(this.deserializeQueueData(currentData));

    // Update queue with new last message
    const updatedQueueData: QueueEntity = {
      ...currentQueue,
      lastMessage,
    };

    // Update in Redis
    await this.redis.hset(queueKey, this.serializeQueueData(updatedQueueData));

    return new Queue(updatedQueueData);
  }

  /**
   * Update queue metadata
   */
  async updateMetadata(sessionId: string, metadata: Record<string, any>): Promise<Queue> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
    
    // Check if queue exists
    const exists = await this.redis.exists(queueKey);
    if (!exists) {
      throw new NotFoundException('Queue entry not found');
    }

    // Get current data
    const currentData = await this.redis.hgetall(queueKey);
    const currentQueue = new Queue(this.deserializeQueueData(currentData));

    // Merge with existing metadata
    const updatedMetadata = {
      ...currentQueue.metadata,
      ...metadata,
    };

    // Update queue with new metadata
    const updatedQueueData: QueueEntity = {
      ...currentQueue,
      metadata: updatedMetadata,
    };

    // Update in Redis
    await this.redis.hset(queueKey, this.serializeQueueData(updatedQueueData));

    return new Queue(updatedQueueData);
  }

  /**
   * Update queue customer data
   */
  async updateCustomer(sessionId: string, customer: Customer): Promise<Queue> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
    
    // Check if queue exists
    const exists = await this.redis.exists(queueKey);
    if (!exists) {
      throw new NotFoundException('Queue entry not found');
    }

    // Get current data
    const currentData = await this.redis.hgetall(queueKey);
    const currentQueue = new Queue(this.deserializeQueueData(currentData));

    // Update queue with new customer data
    const updatedQueueData: QueueEntity = {
      ...currentQueue,
      customer,
      customerId: customer.id, // Ensure customerId is also updated
    };

    // Update in Redis
    await this.redis.hset(queueKey, this.serializeQueueData(updatedQueueData));

    return new Queue(updatedQueueData);
  }

  /**
   * Update queue user data
   */
  async updateUser(sessionId: string, user: User): Promise<Queue> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
    
    // Check if queue exists
    const exists = await this.redis.exists(queueKey);
    if (!exists) {
      throw new NotFoundException('Queue entry not found');
    }

    // Get current data
    const currentData = await this.redis.hgetall(queueKey);
    const currentQueue = new Queue(this.deserializeQueueData(currentData));

    // Update queue with new user data
    const updatedQueueData: QueueEntity = {
      ...currentQueue,
      user,
      userId: user.id, // Ensure userId is also updated
    };

    // Update in Redis
    await this.redis.hset(queueKey, this.serializeQueueData(updatedQueueData));

    return new Queue(updatedQueueData);
  }

  /**
   * Update queue status
   */
  async updateStatus(sessionId: string, status: QueueStatus, attendedAt?: Date): Promise<Queue> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
    
    // Check if queue exists
    const exists = await this.redis.exists(queueKey);
    if (!exists) {
      throw new NotFoundException('Queue entry not found');
    }

    // Get current data
    const currentData = await this.redis.hgetall(queueKey);
    const currentQueue = new Queue(this.deserializeQueueData(currentData));

    // Update queue with new status
    const updatedQueueData: QueueEntity = {
      ...currentQueue,
      status,
      attendedAt: attendedAt || (status === QueueStatus.SERVICE ? new Date() : currentQueue.attendedAt),
    };

    // Update in Redis
    await this.redis.hset(queueKey, this.serializeQueueData(updatedQueueData));

    return new Queue(updatedQueueData);
  }

  /**
   * Comprehensive queue update function
   */
  async updateQueueData(sessionId: string, updateData: {
    customer?: Customer;
    user?: User;
    lastMessage?: Message;
    metadata?: Record<string, any>;
    status?: QueueStatus;
    attendedAt?: Date;
  }): Promise<Queue> {
    const queueKey = `${this.QUEUE_KEY_PREFIX}${sessionId}`;
    
    // Check if queue exists
    const exists = await this.redis.exists(queueKey);
    if (!exists) {
      throw new NotFoundException('Queue entry not found');
    }

    // Get current data
    const currentData = await this.redis.hgetall(queueKey);
    const currentQueue = new Queue(this.deserializeQueueData(currentData));

    // Prepare update data
    const updatedQueueData: QueueEntity = {
      ...currentQueue,
    };

    // Update customer if provided
    if (updateData.customer) {
      updatedQueueData.customer = updateData.customer;
      updatedQueueData.customerId = updateData.customer.id;
    }

    // Update user if provided
    if (updateData.user) {
      updatedQueueData.user = updateData.user;
      updatedQueueData.userId = updateData.user.id;
    }

    // Update last message if provided
    if (updateData.lastMessage) {
      updatedQueueData.lastMessage = updateData.lastMessage;
    }

    // Update metadata if provided (merge with existing)
    if (updateData.metadata) {
      updatedQueueData.metadata = {
        ...currentQueue.metadata,
        ...updateData.metadata,
      };
    }

    // Update status if provided
    if (updateData.status) {
      updatedQueueData.status = updateData.status;
    }

    // Update attendedAt if provided
    if (updateData.attendedAt) {
      updatedQueueData.attendedAt = updateData.attendedAt;
    } else if (updateData.status === QueueStatus.SERVICE && !currentQueue.attendedAt) {
      // Auto-set attendedAt when moving to service status
      updatedQueueData.attendedAt = new Date();
    }

    // Update in Redis
    await this.redis.hset(queueKey, this.serializeQueueData(updatedQueueData));

    return new Queue(updatedQueueData);
  }

  /**
   * Clear all Redis queues and messages
   */
  async clearAllQueues(): Promise<{ message: string; clearedCount: number; messagesClearedCount: number }> {
    // Get all queue keys
    const allSessionIds = await this.redis.zrevrange(this.QUEUE_INDEX_KEY, 0, -1);
    
    if (allSessionIds.length === 0) {
      return { message: 'No queues to clear', clearedCount: 0, messagesClearedCount: 0 };
    }

    // Delete all queue data
    const queueKeys = allSessionIds.map(sessionId => `${this.QUEUE_KEY_PREFIX}${sessionId}`);
    await this.redis.del(...queueKeys);
    
    // Clear all message data for these sessions
    const messageKeys = allSessionIds.map(sessionId => `queue:messages:${sessionId}`);
    const messagesClearedCount = await this.redis.del(...messageKeys);
    
    // Clear the index
    await this.redis.del(this.QUEUE_INDEX_KEY);

    return { 
      message: `Successfully cleared ${allSessionIds.length} queue items and ${messagesClearedCount} message sessions`, 
      clearedCount: allSessionIds.length,
      messagesClearedCount
    };
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
      customer: queue.customer ? JSON.stringify(queue.customer) : '',
      user: queue.user ? JSON.stringify(queue.user) : '',
      lastMessage: queue.lastMessage ? JSON.stringify(queue.lastMessage) : '',
      metadata: queue.metadata ? JSON.stringify(queue.metadata) : '',
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
      customer: data.customer ? JSON.parse(data.customer) : undefined,
      user: data.user ? JSON.parse(data.user) : undefined,
      lastMessage: data.lastMessage ? JSON.parse(data.lastMessage) : undefined,
      metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
    };
  }
}
