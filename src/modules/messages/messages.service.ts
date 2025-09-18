import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { Message, MessageEntity, MessageStatus } from './entities/message.entity';
import { CreateMessageDto, UpdateMessageDto, MessageQueryDto, AddReactionDto } from './dto/message.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class MessagesService {
  constructor(@InjectKnex() private readonly knex: Knex) {}

  /**
   * List messages with filtering and pagination
   */
  async listMessages(query: MessageQueryDto): Promise<PaginatedResult<Message>> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const offset = (page - 1) * limit;
    const sortBy = query.sortBy || 'sentAt';
    const sortOrder = query.sortOrder || 'desc';

    // Build query
    let queryBuilder = this.knex('messages');

    // Apply filters
    if (query.sessionId) {
      queryBuilder = queryBuilder.where('sessionId', query.sessionId);
    }

    if (query.senderId) {
      queryBuilder = queryBuilder.where('senderId', query.senderId);
    }

    if (query.recipientId) {
      queryBuilder = queryBuilder.where('recipientId', query.recipientId);
    }

    if (query.platform) {
      queryBuilder = queryBuilder.where('platform', query.platform);
    }

    if (query.type) {
      queryBuilder = queryBuilder.where('type', query.type);
    }

    if (query.status) {
      queryBuilder = queryBuilder.where('status', query.status);
    }

    if (query.fromMe !== undefined) {
      queryBuilder = queryBuilder.where('fromMe', query.fromMe);
    }

    if (query.system !== undefined) {
      queryBuilder = queryBuilder.where('system', query.system);
    }

    if (query.isGroup !== undefined) {
      queryBuilder = queryBuilder.where('isGroup', query.isGroup);
    }

    if (query.search) {
      queryBuilder = queryBuilder.where('message', 'ilike', `%${query.search}%`);
    }

    // Get total count
    const totalQuery = queryBuilder.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    // Apply pagination and sorting
    const messages = await queryBuilder
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return {
      data: messages.map(msg => new Message(msg)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Find message by ID or messageId
   */
  async findMessage(identifier: string): Promise<Message> {
    // Try to find by UUID first (primary key)
    let message = await this.knex('messages')
      .where('id', identifier)
      .first();

    // If not found by UUID, try by messageId
    if (!message) {
      message = await this.knex('messages')
        .where('messageId', identifier)
        .first();
    }

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return new Message(message);
  }

  /**
   * Create a new message
   */
  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    // Check if message with same messageId already exists
    const existingMessage = await this.knex('messages')
      .where('messageId', createMessageDto.messageId)
      .first();

    if (existingMessage) {
      throw new ConflictException('Message with this messageId already exists');
    }

    // Validate foreign key references
    const senderExists = await this.knex('user')
      .where('id', createMessageDto.senderId)
      .first();

    if (!senderExists) {
      throw new BadRequestException('Sender not found');
    }

    const recipientExists = await this.knex('customer')
      .where('id', createMessageDto.recipientId)
      .first();

    if (!recipientExists) {
      throw new BadRequestException('Recipient not found');
    }

    // Validate reply message if provided
    if (createMessageDto.replyMessageId) {
      const replyMessage = await this.knex('messages')
        .where('messageId', createMessageDto.replyMessageId)
        .first();

      if (!replyMessage) {
        throw new BadRequestException('Reply message not found');
      }
    }

    const [newMessage] = await this.knex('messages')
      .insert({
        ...createMessageDto,
        status: createMessageDto.status || MessageStatus.PENDING,
        sentAt: this.knex.fn.now(),
        createdAt: this.knex.fn.now(),
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return new Message(newMessage);
  }

  /**
   * Update a message
   */
  async updateMessage(id: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
    const message = await this.knex('messages')
      .where('id', id)
      .first();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const [updatedMessage] = await this.knex('messages')
      .where('id', id)
      .update({
        ...updateMessageDto,
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return new Message(updatedMessage);
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(addReactionDto: AddReactionDto): Promise<void> {
    // Check if message exists
    const message = await this.knex('messages')
      .where('messageId', addReactionDto.messageId)
      .first();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if reaction already exists from this user
    const existingReaction = await this.knex('messageReactions')
      .where('messageId', addReactionDto.messageId)
      .where('reactorId', addReactionDto.reactorId)
      .first();

    if (existingReaction) {
      // Update existing reaction
      await this.knex('messageReactions')
        .where('messageId', addReactionDto.messageId)
        .where('reactorId', addReactionDto.reactorId)
        .update({
          emoji: addReactionDto.emoji,
          reactedAt: this.knex.fn.now(),
          updatedAt: this.knex.fn.now(),
        });
    } else {
      // Create new reaction
      await this.knex('messageReactions')
        .insert({
          messageId: addReactionDto.messageId,
          reactorId: addReactionDto.reactorId,
          emoji: addReactionDto.emoji,
          reactedAt: this.knex.fn.now(),
          createdAt: this.knex.fn.now(),
          updatedAt: this.knex.fn.now(),
        });
    }
  }

  /**
   * Delete a reaction from a message
   */
  async deleteReaction(messageId: string, reactorId: string): Promise<void> {
    const reaction = await this.knex('messageReactions')
      .where('messageId', messageId)
      .where('reactorId', reactorId)
      .first();

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.knex('messageReactions')
      .where('messageId', messageId)
      .where('reactorId', reactorId)
      .del();
  }

  /**
   * Delete a message (soft delete by updating status)
   */
  async deleteMessage(id: string): Promise<void> {
    const message = await this.knex('messages')
      .where('id', id)
      .first();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.knex('messages')
      .where('id', id)
      .update({
        status: MessageStatus.DELETED,
        updatedAt: this.knex.fn.now(),
      });
  }

  /**
   * Get message reactions
   */
  async getMessageReactions(messageId: string): Promise<any[]> {
    const reactions = await this.knex('messageReactions')
      .where('messageId', messageId)
      .orderBy('reactedAt', 'desc');

    return reactions;
  }

  /**
   * Get reaction counts for a message
   */
  async getReactionCounts(messageId: string): Promise<any> {
    const counts = await this.knex('messageReactions')
      .where('messageId', messageId)
      .select('emoji')
      .count('* as count')
      .groupBy('emoji');

    return counts.reduce((acc, item) => {
      acc[item.emoji] = parseInt(item.count as string);
      return acc;
    }, {});
  }

  /**
   * Check if user has reacted to a message
   */
  async hasUserReacted(messageId: string, reactorId: string): Promise<boolean> {
    const reaction = await this.knex('messageReactions')
      .where('messageId', messageId)
      .where('reactorId', reactorId)
      .first();

    return !!reaction;
  }

  /**
   * Get user's reaction to a message
   */
  async getUserReaction(messageId: string, reactorId: string): Promise<string | null> {
    const reaction = await this.knex('messageReactions')
      .where('messageId', messageId)
      .where('reactorId', reactorId)
      .first();

    return reaction ? reaction.emoji : null;
  }
}
