import { Injectable, Logger } from '@nestjs/common';
import { CustomerService } from '../../../customer/customer.service';
import { QueueService } from '../../../customer-queue/queue.service';
import { MessageStorageService } from '../../../messages/message-storage.service';
import { AtosBotService } from '../../../atos-bot/atos-bot.service';
import { Customer, CustomerPlatform, CustomerStatus, CustomerType } from '../../../customer/entities/customer.entity';
import { MessagePlatform } from '../../../messages/entities/message.entity';
import { CreateCustomerDto } from '../../../customer/dto/customer.dto';
import { CreateQueueWhatsAppDto } from '../../../customer-queue/dto/queue.dto';
import { randomUUID } from 'crypto';
import { OtimaWebhookMessagePayload, OtimaStatusWebhookPayload } from '../interfaces/otima.interface';

@Injectable()
export class OtimaWebhookService {
  private readonly logger = new Logger(OtimaWebhookService.name);
  private readonly blacklist: string[] = [];

  constructor(
    private readonly customerService: CustomerService,
    private readonly queueService: QueueService,
    private readonly messageStorageService: MessageStorageService,
    private readonly atosBotService: AtosBotService,
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
    const queue = await this.ensureQueue(customer, contactUid);
    const lastMessage = await this.messageStorageService.storePlatformMessage(
      {
        data: messageJson,
        customer,
        platform: 'otima',
      },
      MessagePlatform.WHATSAPP,
      queue.sessionId,
    );
    await this.queueService.updateLastMessage(queue.sessionId, lastMessage.redisMessage);
    const text = lastMessage.redisMessage?.message ?? '';
    if (text) {
      await this.atosBotService.processMessage(queue.sessionId, customer.id, text);
    }
  }

  private async processStatusUpdate(status: OtimaStatusWebhookPayload): Promise<void> {
    const messageId = status.message_id;
    if (!messageId) {
      this.logger.warn('Otima status webhook without message_id, skipping');
      return;
    }
    const mappedStatus = this.mapStatus(status.status);
    await this.messageStorageService.handleMessageUpdate(messageId, mappedStatus);
  }

  private mapStatus(status: string): string {
    const value = status.toLowerCase();
    if (value === 'lido') {
      return 'read';
    }
    if (value === 'entregue') {
      return 'delivered';
    }
    if (value === 'enviado') {
      return 'sent';
    }
    return 'sent';
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

  private async ensureQueue(customer: Customer, contactUid: string): Promise<any> {
    try {
      return await this.queueService.findQueueByCustomerId(customer.id);
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
      return this.queueService.findQueueByCustomerId(customer.id);
    }
  }
}


