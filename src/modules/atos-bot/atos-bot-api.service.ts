import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { QueueService } from '../customer-queue/queue.service';
import { MessagesService } from '../messages/messages.service';
import { CustomerService } from '../customer/customer.service';
import { QueueStatus } from '../customer-queue/entities/queue.entity';
import { CreateMessageDto } from '../messages/dto/message.dto';
import { MessageType, MessagePlatform, SenderType, RecipientType } from '../messages/entities/message.entity';
import { HistoryPlatform } from '../history/entities/history.entity';
import { Customer, CustomerEntity, CustomerPlatform } from '../customer/entities/customer.entity';
import { CustomerResponseDto, FindCustomerDto } from '../customer';

/**
 * Atos Bot API Service
 * Handles database operations for legacy endpoints
 * Updated to use new structure:
 * - tab_filain → Queue (Redis)
 * - tab_atendein → Queue with SERVICE status
 * - tab_logs → Messages
 * - tab_optin → Customer table
 * - tab_skip_bot → Customer.skipBot (needs to be implemented)
 */
@Injectable()
export class AtosBotApiService {
  private readonly logger = new Logger(AtosBotApiService.name);
  private readonly cdn: string;
  private readonly botUserId = '491b9564-2d79-11ea-978f-2e728ce88125'; // Bot user ID

  constructor(
    @InjectKnex() private readonly knex: Knex,
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
    private readonly messagesService: MessagesService,
    private readonly customerService: CustomerService,
  ) {
    this.cdn = this.configService.get<string>('CDN_URL') || '';
  }

  /**
   * Get WhatsApp session data
   * Returns queue and messages in current structure format
   */
  async getWhatsAppSession(sessionId: string): Promise<any> {
    try {
      // Get queue
      let queue;
      try {
        queue = await this.queueService.findQueueBySessionId(sessionId);
      } catch (error) {
        // Queue not found, return empty
        return {
          queue: null,
          messages: [],
          customer: null,
        };
      }

      // Get messages for this session
      const messages = await this.messagesService.listMessages({
        sessionId,
        page: '1',
        limit: '1000',
      });

      return {
        queue: {
          sessionId: queue.sessionId,
          customerId: queue.customerId,
          userId: queue.userId,
          platform: queue.platform,
          status: queue.status,
          createdAt: queue.createdAt,
          attendedAt: queue.attendedAt,
          isInService: queue.status === QueueStatus.SERVICE,
        },
        customer: queue.customer ? {
          id: queue.customer.id,
          platformId: queue.customer.platformId,
          name: queue.customer.name || queue.customer.pushName,
          contact: queue.customer.contact,
          email: queue.customer.email,
          cnpj: queue.customer.cnpj,
        } : null,
        messages: messages.data.map((msg) => ({
          id: msg.id,
          messageId: msg.messageId,
          sessionId: msg.sessionId,
          senderType: msg.senderType,
          recipientType: msg.recipientType,
          customerId: msg.customerId,
          userId: msg.userId,
          fromMe: msg.fromMe,
          system: msg.system,
          message: msg.message,
          media: msg.media,
          type: msg.type,
          platform: msg.platform,
          status: msg.status,
          sentAt: msg.sentAt,
        })),
      };
    } catch (error) {
      this.logger.error(`Error getting WhatsApp session: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create message entry
   * Uses current Messages structure
   */
  async createMessage(params: {
    messageId: string;
    sessionId: string;
    senderType: SenderType;
    recipientType: RecipientType;
    customerId?: string | null;
    userId?: string | null;
    fromMe: boolean;
    message?: string;
    media?: string;
    type: MessageType;
    platform: MessagePlatform;
    system?: boolean;
    isGroup?: boolean;
  }): Promise<void> {
    try {
      const createMessageDto: CreateMessageDto = {
        messageId: params.messageId,
        sessionId: params.sessionId,
        senderType: params.senderType,
        recipientType: params.recipientType,
        customerId: params.customerId || null,
        userId: params.userId || null,
        fromMe: params.fromMe,
        system: params.system || false,
        isGroup: params.isGroup || false,
        message: params.message,
        media: params.media,
        type: params.type,
        platform: params.platform,
      };

      await this.messagesService.createMessage(createMessageDto);
      this.logger.log(`New message created: ${params.messageId}`);
    } catch (error) {
      this.logger.error(`Error creating message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get atendimento record by sessionBot
   * Maps: tab_atendein → Queue with SERVICE status
   * Returns current structure format
   */
  async getAtendimentoBySession(sessionBot: string): Promise<any> {
    try {
      const queue = await this.queueService.findQueueBySessionId(sessionBot);
      
      // Only return if in service (attended by human)
      if (queue.status !== QueueStatus.SERVICE) {
        return null;
      }

      return {
        queue: {
          sessionId: queue.sessionId,
          customerId: queue.customerId,
          userId: queue.userId,
          platform: queue.platform,
          status: queue.status,
          createdAt: queue.createdAt,
          attendedAt: queue.attendedAt,
          isInService: true,
        },
        customer: queue.customer ? {
          id: queue.customer.id,
          platformId: queue.customer.platformId,
          name: queue.customer.name || queue.customer.pushName,
          contact: queue.customer.contact,
          email: queue.customer.email,
          cnpj: queue.customer.cnpj,
        } : null,
        user: queue.user ? {
          id: queue.user.id,
          name: queue.user.name,
          email: queue.user.email,
        } : null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      this.logger.error(`Error getting atendimento: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Check if session exists in queue (replaces tab_filain)
   * Returns current structure format
   */
  async getFilainBySession(sessionBot: string): Promise<any> {
    try {
      const queue = await this.queueService.findQueueBySessionId(sessionBot);
      
      return {
        queue: {
          sessionId: queue.sessionId,
          customerId: queue.customerId,
          userId: queue.userId,
          platform: queue.platform,
          status: queue.status,
          createdAt: queue.createdAt,
          attendedAt: queue.attendedAt,
          isBot: queue.status === QueueStatus.BOT,
          isWaiting: queue.status === QueueStatus.WAITING,
          isInService: queue.status === QueueStatus.SERVICE,
          metadata: queue.metadata,
        },
        customer: queue.customer ? {
          id: queue.customer.id,
          platformId: queue.customer.platformId,
          name: queue.customer.name || queue.customer.pushName,
          contact: queue.customer.contact,
          email: queue.customer.email,
          cnpj: queue.customer.cnpj,
        } : null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      this.logger.error(`Error getting filain: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Check WhatsApp origin
   * Maps: tab_filain.origem → Queue.platform
   */
  async checkWhatsApp(sessionid: string): Promise<boolean> {
    try {
      const queue = await this.queueService.findQueueBySessionId(sessionid);
      return queue.platform === HistoryPlatform.WHATSAPP;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }
      this.logger.error(`Error checking WhatsApp: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Check optin
   * Maps: tab_optin → Customer table
   * Returns current structure format
   * NOTE: Customer table doesn't have optin flag - needs to be added or use tags
   */
  async checkOptin(cnpj: string): Promise<{ optin: boolean; customers: any[] }> {
    try {
      // Normalize CNPJ
      const normalizedCnpj = cnpj && typeof cnpj === 'string' ? cnpj.replace(/\D/g, '') : cnpj;
      
      // Find customer by CNPJ
      const customers = await this.knex('customer')
        .where('cnpj', normalizedCnpj)
        .select('*');

      // TODO: Check if customer has optin tag or flag
      // For now, consider it opted in if customer exists
      const optin = customers.length > 0;

      return {
        optin,
        customers: customers.map(c => ({
          id: c.id,
          platformId: c.platformId,
          name: c.name || c.pushName,
          contact: c.contact,
          email: c.email,
          cnpj: c.cnpj,
          platform: c.platform,
          type: c.type,
          status: c.status,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
      };
    } catch (error) {
      this.logger.error(`Error checking optin: ${error.message}`, error.stack);
      return { optin: false, customers: [] };
    }
  }

  /**
   * Check skip bot
   * Maps: tab_skip_bot → Customer.skipBot
   * Returns current structure format
   * NOTE: Customer.skipBot field needs to be added to the entity and database
   */
  async checkSkipBot(cnpj: string): Promise<{ skipBot: boolean; customer: CustomerResponseDto | null }> {
    try {
      // Normalize CNPJ
      const normalizedCnpj = cnpj && typeof cnpj === 'string' ? cnpj.replace(/\D/g, '') : cnpj;
      
      // Find customer by CNPJ
      const customer = await this.knex('customer')
        .where('cnpj', normalizedCnpj)
        .select('*')
        .first();

      return {
        skipBot: customer?.skipBot || false,
        customer: customer ? new Customer(customer as CustomerEntity).toResponseDto() : null,
      };
    } catch (error) {
      this.logger.error(`Error checking skip bot: ${error.message}`, error.stack);
      return { skipBot: false, customer: null };
    }
  }

  /**
   * Register or update optin
   * Maps: tab_optin → Customer table
   */
  async cadastroOptin(cnpj: string, phone: string, email: string): Promise<void> {
    try {
      // Normalize CNPJ
      const normalizedCnpj = cnpj && typeof cnpj === 'string' ? cnpj.replace(/\D/g, '') : cnpj;
      
      // Find existing customer by CNPJ
      const existing = await this.knex('customer')
        .where('cnpj', normalizedCnpj)
        .first();

      if (existing) {
        // Update customer
        await this.knex('customer')
          .where('id', existing.id)
          .update({
            email,
            contact: phone,
            updatedAt: this.knex.fn.now(),
          });
      } else {
        // Create new customer
        // NOTE: We need platformId - using phone as platformId for now
        await this.knex('customer').insert({
          id: randomUUID(),
          platformId: phone,
          contact: phone,
          email,
          cnpj: normalizedCnpj,
          platform: CustomerPlatform.WHATSAPP, // Default to WhatsApp
          type: 'contact',
          status: 'active',
          priority: 0,
          isGroup: false,
          createdAt: this.knex.fn.now(),
          updatedAt: this.knex.fn.now(),
        });
      }

      // TODO: Add optin tag or flag to customer
    } catch (error) {
      this.logger.error(`Error registering optin: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update optin access
   * Maps: tab_optin + tab_acesso_optin → Customer table
   * NOTE: tab_acesso_optin tracking needs to be implemented separately
   */
  async updateOptin(cnpj: string): Promise<void> {
    try {
      // Normalize CNPJ
      const normalizedCnpj = cnpj && typeof cnpj === 'string' ? cnpj.replace(/\D/g, '') : cnpj;
      
      const existing = await this.knex('customer')
        .where('cnpj', normalizedCnpj)
        .first();

      if (existing) {
        // Update customer access timestamp
        await this.knex('customer')
          .where('id', existing.id)
          .update({
            updatedAt: this.knex.fn.now(),
          });

        // TODO: Track access in separate table if needed (tab_acesso_optin equivalent)
      }
    } catch (error) {
      this.logger.error(`Error updating optin: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Convert emoji to HTML
   * Note: This is a placeholder - actual implementation depends on emoji library
   */
  private unifiedToHTML(text: string): string {
    if (!text) return '';
    // TODO: Implement proper emoji conversion if needed
    // For now, return text as-is
    return text;
  }

  /**
   * Get logs for session
   * Maps: tab_logs → Messages
   * Returns current structure format
   */
  async getLogsBySession(sessionid: string): Promise<any> {
    try {
      const messages = await this.messagesService.listMessages({
        sessionId: sessionid,
        page: '1',
        limit: '1000',
      });

      return {
        messages: messages.data.map(msg => ({
          id: msg.id,
          messageId: msg.messageId,
          sessionId: msg.sessionId,
          senderType: msg.senderType,
          recipientType: msg.recipientType,
          customerId: msg.customerId,
          userId: msg.userId,
          fromMe: msg.fromMe,
          system: msg.system,
          message: msg.message,
          media: msg.media,
          type: msg.type,
          platform: msg.platform,
          status: msg.status,
          sentAt: msg.sentAt,
        })),
        total: messages.total,
        page: messages.page,
        limit: messages.limit,
      };
    } catch (error) {
      this.logger.error(`Error getting logs: ${error.message}`, error.stack);
      return {
        messages: [],
        total: 0,
        page: 1,
        limit: 1000,
      };
    }
  }

  /**
   * Find index by regex in array
   */
  private findIndexByRegex(array: string[], regex: RegExp): number {
    for (let i = 0; i < array.length; i++) {
      if (regex.test(array[i])) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Convert emoji to HTML (public method)
   */
  convertEmojiToHTML(text: string): string {
    return this.unifiedToHTML(text);
  }

  // Helper mapping methods

  private mapMessageTypeToLegacy(type: MessageType): string {
    const map: Record<MessageType, string> = {
      [MessageType.TEXT]: 'chat',
      [MessageType.IMAGE]: 'image',
      [MessageType.VIDEO]: 'video',
      [MessageType.AUDIO]: 'audio',
      [MessageType.DOCUMENT]: 'document',
      [MessageType.LOCATION]: 'location',
      [MessageType.CONTACT]: 'vcard',
      [MessageType.STICKER]: 'image',
      [MessageType.OTHER]: 'chat',
    };
    return map[type] || 'chat';
  }

  private mapLegacyTypeToMessageType(type: string): MessageType {
    const map: Record<string, MessageType> = {
      chat: MessageType.TEXT,
      image: MessageType.IMAGE,
      video: MessageType.VIDEO,
      audio: MessageType.AUDIO,
      document: MessageType.DOCUMENT,
      location: MessageType.LOCATION,
      vcard: MessageType.CONTACT,
      ptt: MessageType.AUDIO, // PTT (push-to-talk) maps to AUDIO
      connect: MessageType.TEXT,
      disconnect: MessageType.TEXT,
    };
    return map[type] || MessageType.TEXT;
  }

  private mapPlatformToOrigem(platform: HistoryPlatform): string {
    const map: Record<HistoryPlatform, string> = {
      [HistoryPlatform.WHATSAPP]: 'wpp',
      [HistoryPlatform.TELEGRAM]: 'telegram',
      [HistoryPlatform.INSTAGRAM]: 'instagram',
      [HistoryPlatform.FACEBOOK]: 'facebook',
      [HistoryPlatform.OTHER]: 'chatweb',
    };
    return map[platform] || 'chatweb';
  }

  private mapOrigemToPlatform(origem: string): HistoryPlatform {
    const map: Record<string, HistoryPlatform> = {
      wpp: HistoryPlatform.WHATSAPP,
      whatsapp: HistoryPlatform.WHATSAPP,
      telegram: HistoryPlatform.TELEGRAM,
      instagram: HistoryPlatform.INSTAGRAM,
      facebook: HistoryPlatform.FACEBOOK,
      chatweb: HistoryPlatform.OTHER,
      bot: HistoryPlatform.OTHER,
    };
    return map[origem.toLowerCase()] || HistoryPlatform.OTHER;
  }

  private mapHistoryPlatformToMessagePlatform(platform: HistoryPlatform): MessagePlatform {
    const map: Record<HistoryPlatform, MessagePlatform> = {
      [HistoryPlatform.WHATSAPP]: MessagePlatform.WHATSAPP,
      [HistoryPlatform.TELEGRAM]: MessagePlatform.TELEGRAM,
      [HistoryPlatform.INSTAGRAM]: MessagePlatform.INSTAGRAM,
      [HistoryPlatform.FACEBOOK]: MessagePlatform.FACEBOOK,
      [HistoryPlatform.OTHER]: MessagePlatform.WHATSAPP, // Default
    };
    return map[platform] || MessagePlatform.WHATSAPP;
  }
}
