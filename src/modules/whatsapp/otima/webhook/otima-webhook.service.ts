import { Injectable, Logger } from '@nestjs/common';
import { CustomerService } from '../../../customer/customer.service';
import { QueueService } from '../../../customer-queue/queue.service';
import { MessageStorageService } from '../../../messages/message-storage.service';
import { ChatMessagePayload, SocketService } from '../../../socket/socket.service';
import { OtimaService } from '../otima.service';
import { Customer, CustomerPlatform, CustomerStatus, CustomerType } from '../../../customer/entities/customer.entity';
import {
  MessagePlatform,
  MessageType,
  MessageStatus,
  SenderType,
  RecipientType,
} from '../../../messages/entities/message.entity';
import { CreateCustomerDto } from '../../../customer/dto/customer.dto';
import { CreateQueueWhatsAppDto } from '../../../customer-queue/dto/queue.dto';
import { QueueStatus } from '../../../customer-queue/entities/queue.entity';
import { PlatformMessageData } from '../../../messages/message-mapper';
import { randomUUID } from 'crypto';
import { OtimaWebhookMessagePayload, OtimaStatusWebhookPayload } from '../interfaces/otima.interface';
import {
  HOLIDAY_DATE_RANGE,
  DEFAULT_WELCOME_MESSAGE,
  HOLIDAY_WELCOME_MESSAGE,
} from './welcome-message.constants';

@Injectable()
export class OtimaWebhookService {
  private readonly logger = new Logger(OtimaWebhookService.name);
  private readonly blacklist: string[] = [];

  constructor(
    private readonly customerService: CustomerService,
    private readonly queueService: QueueService,
    private readonly messageStorageService: MessageStorageService,
    private readonly socketService: SocketService,
    private readonly otimaService: OtimaService,
  ) {}

  async processInboundMessages(payload: OtimaWebhookMessagePayload[]): Promise<void> {
    if (!Array.isArray(payload)) {
      this.logger.warn('Otima inbound payload is not an array, skipping');
      return;
    }
    for (const message of payload) {
      await this.processInboundMessage(message);
    }
  }

  async processStatusUpdates(payload: OtimaStatusWebhookPayload[]): Promise<void> {
    if (!Array.isArray(payload)) {
      this.logger.warn('Otima status payload is not an array, skipping');
      return;
    }
    for (const status of payload) {
      await this.processStatusUpdate(status);
    }
  }

  private async processInboundMessage(messageJson: OtimaWebhookMessagePayload): Promise<void> {
    const contactUid = messageJson.phone;
    if (!contactUid) {
      this.logger.warn('Otima webhook without phone, skipping');
      return;
    }
    if (this.blacklist.includes(contactUid)) {
      this.logger.log(`Contact ${contactUid} is in blacklist, ignoring message`);
      return;
    }
    if (contactUid.indexOf('status') >= 0) {
      this.logger.log('Skipping status message from Otima');
      return;
    }
    if (contactUid.indexOf('g.us') > -1) {
      this.logger.log('Group message received from Otima, currently ignored');
      return;
    }
    const customer = await this.findOrCreateCustomer(contactUid, messageJson);
    const { queue, isNewQueue } = await this.ensureQueue(customer, contactUid);
    const inboundResult = await this.messageStorageService.storePlatformMessage(
      {
        data: messageJson,
        customer,
        platform: 'otima',
      },
      MessagePlatform.WHATSAPP,
      queue.sessionId,
    );
    if (isNewQueue) {
      await this.sendWelcomeMessage(contactUid, queue.sessionId, customer.id);
    } else {
      await this.queueService.updateLastMessage(queue.sessionId, inboundResult.redisMessage);
    }
    this.emitMessageToAssignedUser(queue, inboundResult.postgresMessage);
  }

  private async processStatusUpdate(status: OtimaStatusWebhookPayload): Promise<void> {
    const messageId = status.message_id;
    if (!messageId) {
      this.logger.warn('Otima status webhook without message_id, skipping');
      return;
    }
    const result = await this.messageStorageService.handleOtimaMessageUpdate(messageId, status.status);
    if (result) {
      await this.emitStatusUpdateToAssignedUser(result);
    }
  }

  /**
   * Sends message status update to the queue's assigned user when customer is in service.
   */
  private async emitStatusUpdateToAssignedUser(result: {
    sessionId: string;
    messageId: string;
    status: string;
  }): Promise<void> {
    try {
      const queue = await this.queueService.findQueueBySessionId(result.sessionId);
      const isInService = queue.status === QueueStatus.SERVICE;
      const hasAssignedUser = queue.userId && queue.userId !== 'system';
      if (isInService && hasAssignedUser) {
        this.socketService.sendMessageStatusUpdateToUser(queue.userId, {
          messageId: result.messageId,
          status: result.status as 'sent' | 'delivered' | 'read' | 'failed',
          timestamp: new Date().toISOString(),
          chatId: result.sessionId,
        });
      }
    } catch {
      // Queue may not exist (e.g. session ended); ignore
    }
  }

  private async findOrCreateCustomer(
    contactUid: string,
    messageJson: OtimaWebhookMessagePayload,
  ): Promise<Customer> {
    let customer = await this.customerService.findCustomerByPlatformIdWithTags(
      contactUid,
      CustomerPlatform.WHATSAPP,
    );
    if (customer) {
      return customer;
    }
    const createDto: CreateCustomerDto = {
      platformId: contactUid,
      platform: CustomerPlatform.WHATSAPP,
      pushName: messageJson.username,
      name: messageJson.username,
      profilePicUrl: undefined,
      contact: contactUid,
      priority: 0,
      isGroup: false,
      type: CustomerType.CONTACT,
      status: CustomerStatus.ACTIVE,
      tags: [],
    };
    const created = await this.customerService.createCustomer(createDto);
    return this.customerService.findCustomerByIdWithTags(created.id);
  }

  private async ensureQueue(
    customer: Customer,
    contactUid: string,
  ): Promise<{ queue: any; isNewQueue: boolean }> {
    try {
      const queue = await this.queueService.findQueueByCustomerId(customer.id);
      return { queue, isNewQueue: false };
    } catch {
      const sessionId = randomUUID();
      const queueDto: CreateQueueWhatsAppDto = {
        sessionId,
        customerId: customer.id,
        customer,
        userId: 'system',
        metadata: {
          platform: 'otima',
          contactUid,
        },
      };
      await this.queueService.createQueueWhatsApp(queueDto);
      const queue = await this.queueService.findQueueByCustomerId(customer.id);
      return { queue, isNewQueue: true };
    }
  }

  /**
   * Sends the appropriate welcome message based on whether current date is within holiday range.
   * Uses default text for non-holiday, holiday message for 14–17/02/2026.
   * Stores the message and updates queue lastMessage.
   */
  async sendWelcomeMessage(contactUid: string, sessionId: string, customerId: string): Promise<void> {
    try {
      const now = new Date();
      const isHoliday = this.isDateInHolidayRange(now);
      const message = isHoliday ? HOLIDAY_WELCOME_MESSAGE : DEFAULT_WELCOME_MESSAGE;
      const response = await this.otimaService.sendMessage({
        to: contactUid,
        type: 'text',
        text: message,
      });
      const messageId = response.messageId || `welcome-${randomUUID()}`;
      const platformMessageData: PlatformMessageData = {
        messageId,
        sessionId,
        senderType: SenderType.SYSTEM,
        recipientType: RecipientType.CUSTOMER,
        customerId,
        userId: null,
        fromMe: true,
        system: true,
        isGroup: false,
        message,
        type: MessageType.TEXT,
        platform: MessagePlatform.WHATSAPP,
        status: MessageStatus.SENT,
        metadata: response,
      };
      const result = await this.messageStorageService.storeMessage(platformMessageData);
      await this.queueService.updateLastMessage(sessionId, result.redisMessage);
      const queue = await this.queueService.findQueueByCustomerId(customerId);
      this.emitMessageToAssignedUser(queue, result.postgresMessage);
      this.logger.log(`Sent and stored welcome message to ${contactUid}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome message to ${contactUid}`, error as Error);
    }
  }

  private isDateInHolidayRange(date: Date): boolean {
    const time = date.getTime();
    return time >= HOLIDAY_DATE_RANGE.start.getTime() && time <= HOLIDAY_DATE_RANGE.end.getTime();
  }

  /**
   * Emits message to the queue's assigned user only when customer is in service.
   */
  private emitMessageToAssignedUser(
    queue: { status: string; userId: string },
    message: {
      id: string;
      messageId: string;
      sessionId: string;
      senderType: string;
      recipientType: string;
      customerId: string | null;
      userId: string | null;
      fromMe: boolean;
      system: boolean;
      isGroup: boolean;
      message?: string;
      media?: string;
      type: string;
      platform: string;
      status: string;
      metadata?: any;
      replyMessageId?: string;
      sentAt: Date;
      createdAt: Date;
      updatedAt: Date;
    },
  ): void {
    const isInService = queue.status === QueueStatus.SERVICE;
    const hasAssignedUser = queue.userId && queue.userId !== 'system';
    if (isInService && hasAssignedUser) {
      this.socketService.sendChatMessageToUser(queue.userId, this.toChatMessageFormat(message));
    }
  }

  private toChatMessageFormat(message: {
    id: string;
    messageId: string;
    sessionId: string;
    senderType: string;
    recipientType: string;
    customerId: string | null;
    userId: string | null;
    fromMe: boolean;
    system: boolean;
    isGroup: boolean;
    message?: string;
    media?: string;
    type: string;
    platform: string;
    status: string;
    metadata?: any;
    replyMessageId?: string;
    sentAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): ChatMessagePayload {
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
      metadata: message.metadata,
      replyMessageId: message.replyMessageId,
      sentAt: message.sentAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}


