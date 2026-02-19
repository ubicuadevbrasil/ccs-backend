import { Injectable, Logger, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { MessagesService } from './messages.service';
import { MessageType, MessagePlatform, MessageStatus, Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/message.dto';
import { 
  PlatformMessageData, 
  PlatformMessageMapper, 
  MessageMapperService 
} from './message-mapper';

export interface MessageStorageResult {
  redisMessage: any;
  postgresMessage: Message;
}

@Injectable()
export class MessageStorageService {
  private readonly logger = new Logger(MessageStorageService.name);
  private readonly redis: Redis;
  private readonly REDIS_QUEUE_KEY_PREFIX = 'queue:session:';
  private readonly REDIS_MESSAGE_KEY_PREFIX = 'queue:messages:';

  constructor(
    private readonly messagesService: MessagesService,
    private readonly messageMapperService: MessageMapperService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    this.redis = redisClient;
  }

  /**
   * Store message from raw platform data (e.g., Evolution API, Instagram API, etc.)
   * This method automatically maps platform-specific data to our standard format
   */
  async storePlatformMessage(
    rawMessage: any, 
    platform: MessagePlatform, 
    sessionId: string
  ): Promise<MessageStorageResult> {
    try {
      this.logger.log(`Storing ${platform} message for session: ${sessionId}`);

      // Get platform-specific mapper
      const platformType = rawMessage.platform;
      const mapper = this.messageMapperService.getMapper(platform, platformType);
      
      // Map raw message to platform message data
      const platformMessageData = mapper.mapToPlatformMessageData({
        ...rawMessage,
        sessionId,
      }, platform);

      // Store using the standard method
      return await this.storeMessage(platformMessageData);
    } catch (error) {
      this.logger.error(`Error storing ${platform} message for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Store message in both Redis and PostgreSQL
   * Redis mimics PostgreSQL schema with platform-specific metadata
   */
  async storeMessage(platformMessageData: PlatformMessageData): Promise<MessageStorageResult> {
    try {
      this.logger.log(`Storing message for session: ${platformMessageData.sessionId}`);

      let postgresMessage: Message;
      let redisMessage: any;
      try {
        postgresMessage = await this.storeMessageInPostgreSQL(platformMessageData);
      } catch (error) {
        if (error instanceof ConflictException) {
          this.logger.warn(`Duplicate messageId ${platformMessageData.messageId}, returning existing (idempotent)`);
          postgresMessage = await this.messagesService.findMessageByMessageId(platformMessageData.messageId);
          redisMessage = this.buildRedisMessageFromPostgres(postgresMessage);
          return { redisMessage, postgresMessage };
        }
        throw error;
      }

      redisMessage = await this.storeMessageInRedis(platformMessageData);
      this.logger.debug(`Message stored successfully for session: ${platformMessageData.sessionId}`);
      return { redisMessage, postgresMessage };
    } catch (error) {
      this.logger.error(`Error storing message for session ${platformMessageData.sessionId}:`, error);
      throw error;
    }
  }

  private buildRedisMessageFromPostgres(message: Message): any {
    return {
      id: message.id,
      messageId: message.messageId,
      sessionId: message.sessionId,
      senderType: message.senderType,
      recipientType: message.recipientType,
      customerId: message.customerId,
      userId: message.userId,
      fromMe: message.fromMe,
      system: message.system,
      isGroup: message.isGroup,
      message: message.message,
      media: message.media,
      type: message.type,
      platform: message.platform,
      status: message.status,
      replyMessageId: message.replyMessageId,
      sentAt: message.sentAt instanceof Date ? message.sentAt.toISOString() : message.sentAt,
      createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
      updatedAt: message.updatedAt instanceof Date ? message.updatedAt.toISOString() : message.updatedAt,
      redisTimestamp: Date.now(),
      metadata: message.metadata,
    };
  }

  /**
   * Store message in Redis with PostgreSQL schema structure
   */
  private async storeMessageInRedis(platformMessageData: PlatformMessageData): Promise<any> {
    try {
      const redisKey = `${this.REDIS_MESSAGE_KEY_PREFIX}${platformMessageData.sessionId}`;
      
      // Create Redis message object that mimics PostgreSQL schema
      const redisMessage = {
        // PostgreSQL schema fields
        id: platformMessageData.metadata?.id || `redis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        messageId: platformMessageData.messageId,
        sessionId: platformMessageData.sessionId,
        senderType: platformMessageData.senderType,
        recipientType: platformMessageData.recipientType,
        customerId: platformMessageData.customerId,
        userId: platformMessageData.userId,
        fromMe: platformMessageData.fromMe,
        system: platformMessageData.system,
        isGroup: platformMessageData.isGroup,
        message: platformMessageData.message,
        media: platformMessageData.media,
        type: platformMessageData.type,
        platform: platformMessageData.platform,
        status: platformMessageData.status,
        replyMessageId: platformMessageData.replyMessageId,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Additional Redis-specific fields
        redisTimestamp: Date.now(),
        
        // Platform-specific metadata (preserves original format)
        metadata: platformMessageData.metadata,
      };

      // Store in Redis as a list (FIFO order)
      await this.redis.lpush(redisKey, JSON.stringify(redisMessage));
      
      // Set expiration for the session messages (1 week = 7 days)
      await this.redis.expire(redisKey, 604800);
      
      this.logger.debug(`Message stored in Redis for session: ${platformMessageData.sessionId}`);
      return redisMessage;
    } catch (error) {
      this.logger.error(`Error storing message in Redis for session ${platformMessageData.sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Store message in PostgreSQL
   */
  private async storeMessageInPostgreSQL(platformMessageData: PlatformMessageData): Promise<Message> {
    try {
      // Create message DTO for PostgreSQL storage
      const createMessageDto: CreateMessageDto = {
        messageId: platformMessageData.messageId,
        sessionId: platformMessageData.sessionId,
        senderType: platformMessageData.senderType,
        recipientType: platformMessageData.recipientType,
        customerId: platformMessageData.customerId,
        userId: platformMessageData.userId,
        fromMe: platformMessageData.fromMe,
        system: platformMessageData.system,
        isGroup: platformMessageData.isGroup,
        message: platformMessageData.message,
        media: platformMessageData.media,
        type: platformMessageData.type,
        platform: platformMessageData.platform,
        status: platformMessageData.status,
        metadata: platformMessageData.metadata,
        replyMessageId: platformMessageData.replyMessageId,
      };

      // Store in PostgreSQL
      const savedMessage = await this.messagesService.createMessage(createMessageDto);
      
      this.logger.debug(`Message stored in PostgreSQL with ID: ${savedMessage.id}`);
      return savedMessage;
    } catch (error) {
      this.logger.error(`Error storing message in PostgreSQL for session ${platformMessageData.sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get messages from Redis for a specific session (for consumption)
   */
  async getSessionMessages(sessionId: string, limit: number = 50): Promise<any[]> {
    try {
      const redisKey = `${this.REDIS_MESSAGE_KEY_PREFIX}${sessionId}`;
      
      // Get messages from Redis (newest at head via lpush), return ascending (oldest first)
      const messages = await this.redis.lrange(redisKey, 0, limit - 1);
      return messages.map(msg => JSON.parse(msg)).reverse();
    } catch (error) {
      this.logger.error(`Error retrieving messages from Redis for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get message count for a specific session
   */
  async getSessionMessageCount(sessionId: string): Promise<number> {
    try {
      const redisKey = `${this.REDIS_MESSAGE_KEY_PREFIX}${sessionId}`;
      return await this.redis.llen(redisKey);
    } catch (error) {
      this.logger.error(`Error getting message count for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Update message reactions in Redis
   * This method updates the reactions array for a specific message in Redis
   */
  async updateMessageReactionsInRedis(sessionId: string, messageId: string): Promise<void> {
    try {
      const redisKey = `${this.REDIS_MESSAGE_KEY_PREFIX}${sessionId}`;
      
      // Get all messages from Redis
      const messages = await this.redis.lrange(redisKey, 0, -1);
      
      // Find and update the specific message
      let messageUpdated = false;
      const updatedMessages = messages.map(msg => {
        const message = JSON.parse(msg);
        if (message.messageId === messageId) {
          messageUpdated = true;
          // Get current reactions from PostgreSQL
          return this.messagesService.getMessageReactions(messageId).then(reactions => {
            return JSON.stringify({
              ...message,
              reactions: reactions.map(reaction => ({
                emoji: reaction.emoji,
                reactorId: reaction.reactorId,
                reactedAt: reaction.reactedAt,
              })),
            });
          });
        }
        return Promise.resolve(msg);
      });

      if (messageUpdated) {
        // Wait for all updates to complete
        const resolvedMessages = await Promise.all(updatedMessages);
        
        // Clear and repopulate Redis with updated messages
        await this.redis.del(redisKey);
        if (resolvedMessages.length > 0) {
          await this.redis.lpush(redisKey, ...resolvedMessages);
        }
        
        this.logger.log(`Updated reactions for message ${messageId} in Redis for session ${sessionId}`);
      } else {
        this.logger.warn(`Message ${messageId} not found in Redis for session ${sessionId}`);
      }
    } catch (error) {
      this.logger.error(`Error updating message reactions in Redis for session ${sessionId}, message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Clear messages from Redis for a specific session
   */
  async clearSessionMessages(sessionId: string): Promise<void> {
    try {
      const redisKey = `${this.REDIS_MESSAGE_KEY_PREFIX}${sessionId}`;
      await this.redis.del(redisKey);
      this.logger.debug(`Cleared messages from Redis for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error clearing messages from Redis for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Store queue session information in Redis
   */
  async storeQueueSession(sessionId: string, queueData: any): Promise<void> {
    try {
      const redisKey = `${this.REDIS_QUEUE_KEY_PREFIX}${sessionId}`;
      
      const sessionInfo = {
        sessionId,
        ...queueData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store queue session info
      await this.redis.setex(redisKey, 604800, JSON.stringify(sessionInfo)); // 1 week expiration
      
      this.logger.debug(`Queue session stored in Redis: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error storing queue session in Redis for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get queue session information from Redis
   */
  async getQueueSession(sessionId: string): Promise<any | null> {
    try {
      const redisKey = `${this.REDIS_QUEUE_KEY_PREFIX}${sessionId}`;
      const sessionData = await this.redis.get(redisKey);
      
      if (!sessionData) {
        return null;
      }
      
      return JSON.parse(sessionData);
    } catch (error) {
      this.logger.error(`Error retrieving queue session from Redis for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Clear queue session from Redis
   */
  async clearQueueSession(sessionId: string): Promise<void> {
    try {
      const redisKey = `${this.REDIS_QUEUE_KEY_PREFIX}${sessionId}`;
      await this.redis.del(redisKey);
      this.logger.debug(`Cleared queue session from Redis: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error clearing queue session from Redis for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get messages from PostgreSQL for a specific session
   */
  async getSessionMessagesFromPostgreSQL(sessionId: string, limit: number = 50, page: number = 1): Promise<any> {
    try {
      return await this.messagesService.listMessages({
        sessionId,
        limit: limit.toString(),
        page: page.toString(),
        sortBy: 'sentAt',
        sortOrder: 'desc',
      });
    } catch (error) {
      this.logger.error(`Error retrieving messages from PostgreSQL for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Update message status in both Redis and PostgreSQL
   */
  async updateMessageStatus(
    sessionId: string, 
    messageId: string, 
    status: MessageStatus
  ): Promise<void> {
    try {
      // Update in PostgreSQL
      const postgresMessages = await this.getSessionMessagesFromPostgreSQL(sessionId, 1000);
      const message = postgresMessages.data.find((msg: any) => msg.messageId === messageId);
      
      if (message) {
        await this.messagesService.updateMessage(message.id, { status });
      }

      // Update in Redis
      const redisKey = `${this.REDIS_MESSAGE_KEY_PREFIX}${sessionId}`;
      const messages = await this.redis.lrange(redisKey, 0, -1);
      
      for (let i = 0; i < messages.length; i++) {
        const msg = JSON.parse(messages[i]);
        if (msg.messageId === messageId) {
          msg.status = status;
          msg.updatedAt = new Date().toISOString();
          await this.redis.lset(redisKey, i, JSON.stringify(msg));
          break;
        }
      }

      this.logger.debug(`Updated message status for ${messageId} in session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error updating message status for ${messageId} in session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Handle message update from Evolution API
   * Updates message status in both Redis and PostgreSQL by messageId
   */
  async handleMessageUpdate(messageId: string, evolutionStatus: string): Promise<void> {
    try {
      this.logger.log(`Handling Evolution message update for messageId: ${messageId} with status: ${evolutionStatus}`);

      const messageStatus = this.messageMapperService.mapAckStatusToMessageStatus('evolution', evolutionStatus);

      if (!messageStatus) {
        this.logger.warn(`Unknown Evolution status: ${evolutionStatus}, skipping update`);
        return;
      }

      const message = await this.messagesService.findMessageByMessageId(messageId);

      if (!message) {
        throw new NotFoundException(
          `Message not found for messageId: ${messageId}. ACK must only update existing messages; ensure the message webhook runs before the ACK webhook.`,
        );
      }

      await this.updateMessageStatus(message.sessionId, messageId, messageStatus);
      this.logger.log(`Successfully updated message ${messageId} to status ${messageStatus}`);
    } catch (error) {
      this.logger.error(`Error handling Evolution message update for ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Handle Otima ACK status update.
   * Maps Otima CallbackStatus (Portuguese) to MessageStatus and updates existing message.
   * @returns Session ID, message ID and new status when update succeeded, for socket emission; null otherwise.
   */
  async handleOtimaMessageUpdate(
    messageId: string,
    otimaStatus: string,
  ): Promise<{ sessionId: string; messageId: string; status: MessageStatus } | null> {
    try {
      this.logger.log(`Handling Otima message update for messageId: ${messageId} with status: ${otimaStatus}`);

      const messageStatus = this.messageMapperService.mapAckStatusToMessageStatus('otima', otimaStatus);

      if (!messageStatus) {
        this.logger.warn(`Unknown Otima status: ${otimaStatus}, skipping update`);
        return null;
      }

      const message = await this.messagesService.findMessageByMessageId(messageId);

      if (!message) {
        throw new NotFoundException(
          `Message not found for messageId: ${messageId}. ACK must only update existing messages; ensure the message webhook runs before the ACK webhook.`,
        );
      }

      await this.updateMessageStatus(message.sessionId, messageId, messageStatus);
      this.logger.log(`Successfully updated message ${messageId} to status ${messageStatus}`);
      return { sessionId: message.sessionId, messageId, status: messageStatus };
    } catch (error) {
      this.logger.error(`Error handling Otima message update for ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Handle Vonage ACK status update.
   * Maps Vonage status (sent, delivered, read, failed) to MessageStatus and updates existing message.
   * @returns Session ID, message ID and new status when update succeeded, for socket emission; null otherwise.
   */
  async handleVonageMessageUpdate(
    messageId: string,
    vonageStatus: string,
  ): Promise<{ sessionId: string; messageId: string; status: MessageStatus } | null> {
    try {
      this.logger.log(`Handling Vonage message update for messageId: ${messageId} with status: ${vonageStatus}`);
      const messageStatus = this.messageMapperService.mapAckStatusToMessageStatus('vonage', vonageStatus);
      if (!messageStatus) {
        this.logger.warn(`Unknown Vonage status: ${vonageStatus}, skipping update`);
        return null;
      }
      const message = await this.messagesService.findMessageByMessageId(messageId);
      if (!message) {
        throw new NotFoundException(
          `Message not found for messageId: ${messageId}. ACK must only update existing messages; ensure the message webhook runs before the ACK webhook.`,
        );
      }
      await this.updateMessageStatus(message.sessionId, messageId, messageStatus);
      this.logger.log(`Successfully updated message ${messageId} to status ${messageStatus}`);
      return { sessionId: message.sessionId, messageId, status: messageStatus };
    } catch (error) {
      this.logger.error(`Error handling Vonage message update for ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active sessions (sessions with messages in Redis)
   */
  async getActiveSessions(): Promise<string[]> {
    try {
      const pattern = `${this.REDIS_MESSAGE_KEY_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      
      // Extract session IDs from keys
      return keys.map(key => key.replace(this.REDIS_MESSAGE_KEY_PREFIX, ''));
    } catch (error) {
      this.logger.error('Error getting active sessions:', error);
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(sessionId: string): Promise<{
    redisCount: number;
    postgresCount: number;
    lastMessageAt?: string;
    firstMessageAt?: string;
  }> {
    try {
      const redisCount = await this.getSessionMessageCount(sessionId);
      const postgresData = await this.getSessionMessagesFromPostgreSQL(sessionId, 1000);
      const postgresCount = postgresData.total;

      let lastMessageAt: string | undefined;
      let firstMessageAt: string | undefined;

      if (postgresData.data.length > 0) {
        const sortedMessages = postgresData.data.sort((a: any, b: any) => 
          new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        );
        lastMessageAt = sortedMessages[0].sentAt;
        firstMessageAt = sortedMessages[sortedMessages.length - 1].sentAt;
      }

      return {
        redisCount,
        postgresCount,
        lastMessageAt,
        firstMessageAt,
      };
    } catch (error) {
      this.logger.error(`Error getting session statistics for ${sessionId}:`, error);
      throw error;
    }
  }
}
