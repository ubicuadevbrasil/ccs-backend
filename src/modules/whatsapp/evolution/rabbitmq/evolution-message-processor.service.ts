import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  EvolutionApplicationStartupEvent,
  EvolutionInstanceCreateEvent,
  EvolutionInstanceDeleteEvent,
  EvolutionQrcodeUpdatedEvent,
  EvolutionMessagesSetEvent,
  EvolutionMessagesUpsertEvent,
  EvolutionMessagesEditedEvent,
  EvolutionMessagesUpdateEvent,
  EvolutionMessagesDeleteEvent,
  EvolutionSendMessageEvent,
  EvolutionSendMessageUpdateEvent,
  EvolutionContactsSetEvent,
  EvolutionContactsUpsertEvent,
  EvolutionContactsUpdateEvent,
  EvolutionPresenceUpdateEvent,
  EvolutionChatsSetEvent,
  EvolutionChatsUpsertEvent,
  EvolutionChatsUpdateEvent,
  EvolutionChatsDeleteEvent,
  EvolutionGroupsUpsertEvent,
  EvolutionGroupUpdateEvent,
  EvolutionGroupParticipantsUpdateEvent,
  EvolutionConnectionUpdateEvent,
  EvolutionRemoveInstanceEvent,
  EvolutionLogoutInstanceEvent,
  EvolutionCallEvent,
  EvolutionTypebotStartEvent,
  EvolutionTypebotChangeStatusEvent,
} from '../interfaces/evolution-rabbitmq.interface';
import { CustomerService } from '../../../customer/customer.service';
import { QueueService } from '../../../customer-queue/queue.service';
import { MessageStorageService } from '../../../messages/message-storage.service';
import { EvolutionService } from '../evolution.service';
import { Customer, CustomerPlatform, CustomerStatus, CustomerType } from '../../../customer/entities/customer.entity';
import { QueueStatus } from '../../../customer-queue/entities/queue.entity';
import { HistoryPlatform } from '../../../history/entities/history.entity';
import { Message, MessagePlatform, MessageType, MessageStatus, SenderType, RecipientType } from '../../../messages/entities/message.entity';
import { CreateCustomerDto } from '../../../customer/dto/customer.dto';
import { CreateQueueWhatsAppDto } from '../../../customer-queue/dto/queue.dto';
import { Redis } from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class EvolutionMessageProcessorService {
  private readonly logger = new Logger(EvolutionMessageProcessorService.name);
  private readonly logsDir = path.join(process.cwd(), 'logs', 'evolution-events');

  constructor(
    private readonly customerService: CustomerService,
    private readonly queueService: QueueService,
    private readonly messageStorageService: MessageStorageService,
    private readonly evolutionService: EvolutionService,
  ) {
    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  // Application Events
  async handleApplicationStartup(event: EvolutionApplicationStartupEvent): Promise<void> {
    try {
      this.logger.log(`Received APPLICATION_STARTUP event for instance: ${event.instance}`);
      this.logToFile('APPLICATION_STARTUP', event);
      this.logger.log(`Logged APPLICATION_STARTUP event to file`);
    } catch (error) {
      this.logger.error('Error processing APPLICATION_STARTUP event:', error);
      throw error;
    }
  }

  // Instance Events
  async handleInstanceCreate(event: EvolutionInstanceCreateEvent): Promise<void> {
    try {
      this.logger.log(`Received INSTANCE_CREATE event for instance: ${event.instance}`);
      this.logToFile('INSTANCE_CREATE', event);
      this.logger.log(`Logged INSTANCE_CREATE event to file`);
    } catch (error) {
      this.logger.error('Error processing INSTANCE_CREATE event:', error);
      throw error;
    }
  }

  async handleInstanceDelete(event: EvolutionInstanceDeleteEvent): Promise<void> {
    try {
      this.logger.log(`Received INSTANCE_DELETE event for instance: ${event.instance}`);
      this.logToFile('INSTANCE_DELETE', event);
      this.logger.log(`Logged INSTANCE_DELETE event to file`);
    } catch (error) {
      this.logger.error('Error processing INSTANCE_DELETE event:', error);
      throw error;
    }
  }

  async handleQrcodeUpdated(event: EvolutionQrcodeUpdatedEvent): Promise<void> {
    try {
      this.logger.log(`Received QRCODE_UPDATED event for instance: ${event.instance}`);
      this.logToFile('QRCODE_UPDATED', event);
      this.logger.log(`Logged QRCODE_UPDATED event to file`);
    } catch (error) {
      this.logger.error('Error processing QRCODE_UPDATED event:', error);
      throw error;
    }
  }

  // Message Events
  async handleMessagesSet(event: EvolutionMessagesSetEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_SET event for instance: ${event.instance}`);
      this.logToFile('MESSAGES_SET', event);
      this.logger.log(`Logged MESSAGES_SET event to file`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_SET event:', error);
      throw error;
    }
  }

  async handleMessagesUpsert(event: EvolutionMessagesUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_UPSERT event for instance: ${event.instance}`);
      this.logToFile('MESSAGES_UPSERT', event);
      
      // Extract customer information from the message
      const remoteJid = event.data.key.remoteJid;
      const instance = event.instance;
      
      if (!remoteJid) {
        this.logger.warn('No remoteJid found in message data, skipping customer processing');
        return;
      }

      // Process customer and queue management
      await this.processCustomerMessage(remoteJid, instance, event);
      
      this.logger.log(`Successfully processed MESSAGES_UPSERT event for customer: ${remoteJid}`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_UPSERT event:', error);
      throw error;
    }
  }

  async handleMessagesEdited(event: EvolutionMessagesEditedEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_EDITED event for instance: ${event.instance}`);
      this.logToFile('MESSAGES_EDITED', event);
      this.logger.log(`Logged MESSAGES_EDITED event to file`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_EDITED event:', error);
      throw error;
    }
  }

  async handleMessagesUpdate(event: EvolutionMessagesUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_UPDATE event for instance: ${event.instance}`);
      this.logToFile('MESSAGES_UPDATE', event);
      
      // Extract message update data
      const { keyId, status } = event.data;
      
      if (!keyId) {
        this.logger.warn('No messageId found in MESSAGES_UPDATE event, skipping processing');
        return;
      }

      // Handle the message update using the message storage service
      await this.messageStorageService.handleMessageUpdate(keyId, status);
      
      this.logger.log(`Successfully processed MESSAGES_UPDATE event for message: ${keyId} with status: ${status}`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_UPDATE event:', error);
      throw error;
    }
  }

  async handleMessagesDelete(event: EvolutionMessagesDeleteEvent): Promise<void> {
    try {
      this.logger.log(`Received MESSAGES_DELETE event for instance: ${event.instance}`);
      this.logToFile('MESSAGES_DELETE', event);
      this.logger.log(`Logged MESSAGES_DELETE event to file`);
    } catch (error) {
      this.logger.error('Error processing MESSAGES_DELETE event:', error);
      throw error;
    }
  }

  async handleSendMessage(event: EvolutionSendMessageEvent): Promise<void> {
    try {
      this.logger.log(`Received SEND_MESSAGE event for instance: ${event.instance}`);
      this.logToFile('SEND_MESSAGE', event);
      this.logger.log(`Logged SEND_MESSAGE event to file`);
    } catch (error) {
      this.logger.error('Error processing SEND_MESSAGE event:', error);
      throw error;
    }
  }

  async handleSendMessageUpdate(event: EvolutionSendMessageUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received SEND_MESSAGE_UPDATE event for instance: ${event.instance}`);
      this.logToFile('SEND_MESSAGE_UPDATE', event);
      this.logger.log(`Logged SEND_MESSAGE_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing SEND_MESSAGE_UPDATE event:', error);
      throw error;
    }
  }

  // Contact Events
  async handleContactsSet(event: EvolutionContactsSetEvent): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_SET event for instance: ${event.instance}`);
      this.logToFile('CONTACTS_SET', event);
      this.logger.log(`Logged CONTACTS_SET event to file`);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_SET event:', error);
      throw error;
    }
  }

  async handleContactsUpsert(event: EvolutionContactsUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_UPSERT event for instance: ${event.instance}`);
      this.logToFile('CONTACTS_UPSERT', event);
      this.logger.log(`Logged CONTACTS_UPSERT event to file`);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_UPSERT event:', error);
      throw error;
    }
  }

  async handleContactsUpdate(event: EvolutionContactsUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received CONTACTS_UPDATE event for instance: ${event.instance}`);
      this.logToFile('CONTACTS_UPDATE', event);
      this.logger.log(`Logged CONTACTS_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing CONTACTS_UPDATE event:', error);
      throw error;
    }
  }

  async handlePresenceUpdate(event: EvolutionPresenceUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received PRESENCE_UPDATE event for instance: ${event.instance}`);
      this.logToFile('PRESENCE_UPDATE', event);
      this.logger.log(`Logged PRESENCE_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing PRESENCE_UPDATE event:', error);
      throw error;
    }
  }

  // Chat Events
  async handleChatsSet(event: EvolutionChatsSetEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_SET event for instance: ${event.instance}`);
      this.logToFile('CHATS_SET', event);
      this.logger.log(`Logged CHATS_SET event to file`);
    } catch (error) {
      this.logger.error('Error processing CHATS_SET event:', error);
      throw error;
    }
  }

  async handleChatsUpsert(event: EvolutionChatsUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_UPSERT event for instance: ${event.instance}`);
      this.logToFile('CHATS_UPSERT', event);
      this.logger.log(`Logged CHATS_UPSERT event to file`);
    } catch (error) {
      this.logger.error('Error processing CHATS_UPSERT event:', error);
      throw error;
    }
  }

  async handleChatsUpdate(event: EvolutionChatsUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_UPDATE event for instance: ${event.instance}`);
      this.logToFile('CHATS_UPDATE', event);
      this.logger.log(`Logged CHATS_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing CHATS_UPDATE event:', error);
      throw error;
    }
  }

  async handleChatsDelete(event: EvolutionChatsDeleteEvent): Promise<void> {
    try {
      this.logger.log(`Received CHATS_DELETE event for instance: ${event.instance}`);
      this.logToFile('CHATS_DELETE', event);
      this.logger.log(`Logged CHATS_DELETE event to file`);
    } catch (error) {
      this.logger.error('Error processing CHATS_DELETE event:', error);
      throw error;
    }
  }

  // Group Events
  async handleGroupsUpsert(event: EvolutionGroupsUpsertEvent): Promise<void> {
    try {
      this.logger.log(`Received GROUPS_UPSERT event for instance: ${event.instance}`);
      this.logToFile('GROUPS_UPSERT', event);
      this.logger.log(`Logged GROUPS_UPSERT event to file`);
    } catch (error) {
      this.logger.error('Error processing GROUPS_UPSERT event:', error);
      throw error;
    }
  }

  async handleGroupUpdate(event: EvolutionGroupUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received GROUP_UPDATE event for instance: ${event.instance}`);
      this.logToFile('GROUP_UPDATE', event);
      this.logger.log(`Logged GROUP_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing GROUP_UPDATE event:', error);
      throw error;
    }
  }

  async handleGroupParticipantsUpdate(event: EvolutionGroupParticipantsUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received GROUP_PARTICIPANTS_UPDATE event for instance: ${event.instance}`);
      this.logToFile('GROUP_PARTICIPANTS_UPDATE', event);
      this.logger.log(`Logged GROUP_PARTICIPANTS_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing GROUP_PARTICIPANTS_UPDATE event:', error);
      throw error;
    }
  }

  async handleConnectionUpdate(event: EvolutionConnectionUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Received CONNECTION_UPDATE event for instance: ${event.instance}`);
      this.logToFile('CONNECTION_UPDATE', event);
      this.logger.log(`Logged CONNECTION_UPDATE event to file`);
    } catch (error) {
      this.logger.error('Error processing CONNECTION_UPDATE event:', error);
      throw error;
    }
  }

  async handleRemoveInstance(event: EvolutionRemoveInstanceEvent): Promise<void> {
    try {
      this.logger.log(`Received REMOVE_INSTANCE event for instance: ${event.instance}`);
      this.logToFile('REMOVE_INSTANCE', event);
      this.logger.log(`Logged REMOVE_INSTANCE event to file`);
    } catch (error) {
      this.logger.error('Error processing REMOVE_INSTANCE event:', error);
      throw error;
    }
  }

  async handleLogoutInstance(event: EvolutionLogoutInstanceEvent): Promise<void> {
    try {
      this.logger.log(`Received LOGOUT_INSTANCE event for instance: ${event.instance}`);
      this.logToFile('LOGOUT_INSTANCE', event);
      this.logger.log(`Logged LOGOUT_INSTANCE event to file`);
    } catch (error) {
      this.logger.error('Error processing LOGOUT_INSTANCE event:', error);
      throw error;
    }
  }

  async handleCall(event: EvolutionCallEvent): Promise<void> {
    try {
      this.logger.log(`Received CALL event for instance: ${event.instance}`);
      this.logToFile('CALL', event);
      this.logger.log(`Logged CALL event to file`);
    } catch (error) {
      this.logger.error('Error processing CALL event:', error);
      throw error;
    }
  }

  // Typebot Events
  async handleTypebotStart(event: EvolutionTypebotStartEvent): Promise<void> {
    try {
      this.logger.log(`Received TYPEBOT_START event for instance: ${event.instance}`);
      this.logToFile('TYPEBOT_START', event);
      this.logger.log(`Logged TYPEBOT_START event to file`);
    } catch (error) {
      this.logger.error('Error processing TYPEBOT_START event:', error);
      throw error;
    }
  }

  async handleTypebotChangeStatus(event: EvolutionTypebotChangeStatusEvent): Promise<void> {
    try {
      this.logger.log(`Received TYPEBOT_CHANGE_STATUS event for instance: ${event.instance}`);
      this.logToFile('TYPEBOT_CHANGE_STATUS', event);
      this.logger.log(`Logged TYPEBOT_CHANGE_STATUS event to file`);
    } catch (error) {
      this.logger.error('Error processing TYPEBOT_CHANGE_STATUS event:', error);
      throw error;
    }
  }

  /**
   * Process customer message - main workflow implementation
   */
  private async processCustomerMessage(
    remoteJid: string, 
    instance: string, 
    event: EvolutionMessagesUpsertEvent
  ): Promise<void> {
    try {
      // Step 1: Check if customer already exists
      let customer = await this.customerService.findCustomerByPlatformIdWithTags(
        remoteJid, 
        CustomerPlatform.WHATSAPP
      );

      // Step 2: If customer doesn't exist, create one using Evolution API
      if (!customer) {
        this.logger.log(`Customer not found for ${remoteJid}, creating new customer`);
        customer = await this.createCustomerFromWhatsApp(remoteJid, instance);
      } else {
        this.logger.log(`Customer found for ${remoteJid} with ${customer.tags?.length || 0} tags`);
      }

      // Step 3: Check if customer is already in queue
      const isInQueue = await this.queueService.isCustomerInQueue(customer.id);
      const isInService = await this.queueService.isCustomerInService(customer.id);

      // Step 4: If not in queue or service, create queue entry and update profile
      if (!isInQueue && !isInService) {
        this.logger.log(`Customer ${customer.id} not in queue, creating queue entry and updating profile`);
        
        // Update customer profile data when creating new queue entry
        customer = await this.updateCustomerProfileFromWhatsApp(customer, instance);
        
        await this.createQueueEntryForCustomer(customer.id, instance, remoteJid, customer);
      } else {
        this.logger.log(`Customer ${customer.id} already in queue/service, skipping queue creation and profile update`);
      }

      // Step 5: Process the actual message (this is where you'd add your business logic)
      await this.processMessageContent(customer, event);

    } catch (error) {
      this.logger.error(`Error processing customer message for ${remoteJid}:`, error);
      throw error;
    }
  }

  /**
   * Update existing customer profile from WhatsApp using Evolution API
   */
  private async updateCustomerProfileFromWhatsApp(customer: Customer, instance: string): Promise<Customer> {
    try {
      // Fetch fresh profile information from Evolution API
      const profileData = await this.evolutionService.fetchProfile(instance, customer.platformId);
      
      this.logger.log(`Profile data:`, profileData);
      // Check if we have new profile data to update
      const hasNewData = profileData?.name || profileData?.picture;
      
      if (hasNewData) {
        // Update customer with fresh profile data
        const updateData: Partial<CreateCustomerDto> = {};
        
        if (profileData?.name && profileData.name !== customer.pushName) {
          updateData.pushName = profileData.name;
        }
        
        if (profileData?.picture && profileData.picture !== customer.profilePicUrl) {
          updateData.profilePicUrl = profileData.picture;
        }
        
        // Only update if there's actually new data
        if (Object.keys(updateData).length > 0) {
          this.logger.log(`Updating customer ${customer.id} with fresh profile data:`, updateData);
          await this.customerService.updateCustomer(customer.id, updateData);
          // Fetch updated customer with tags
          return await this.customerService.findCustomerByIdWithTags(customer.id);
        }
      }
      
      return customer;
    } catch (error) {
      this.logger.error(`Error updating customer profile for ${customer.platformId}:`, error);
      return customer; // Return existing customer if update fails
    }
  }

  /**
   * Create customer from WhatsApp using Evolution API
   */
  private async createCustomerFromWhatsApp(remoteJid: string, instance: string): Promise<Customer> {
    try {
      // Fetch profile information from Evolution API
      const profileData = await this.evolutionService.fetchProfile(instance, remoteJid);
      
      // Extract customer data from profile
      const customerData: CreateCustomerDto = {
        platformId: remoteJid,
        platform: CustomerPlatform.WHATSAPP,
        pushName: profileData?.name || undefined,
        name: profileData?.name || undefined,
        profilePicUrl: profileData?.picture || undefined,
        contact: remoteJid.includes('@') ? remoteJid.split('@')[0] : remoteJid,
        priority: 0, // Default priority
        isGroup: remoteJid.includes('@g.us'), // Check if it's a group
        type: CustomerType.CONTACT,
        status: CustomerStatus.ACTIVE,
        tags: [], // Default empty tags
      };

      this.logger.log(`Creating customer with data:`, {
        platformId: customerData.platformId,
        pushName: customerData.pushName,
        name: customerData.name,
        profilePicUrl: customerData.profilePicUrl,
        contact: customerData.contact
      });

      // Create customer
      const customer = await this.customerService.createCustomer(customerData);
      this.logger.log(`Created new customer: ${customer.id} for ${remoteJid}`);
      
      // Fetch customer with tags
      return await this.customerService.findCustomerByIdWithTags(customer.id);
    } catch (error) {
      this.logger.error(`Error creating customer for ${remoteJid}:`, error);
      
      // Check if it's a duplicate customer error
      if (error.status === 409 || error.message?.includes('already exists')) {
        this.logger.log(`Customer already exists for ${remoteJid}, fetching existing customer`);
        // Try to find the existing customer
        const existingCustomer = await this.customerService.findCustomerByPlatformId(
          remoteJid, 
          CustomerPlatform.WHATSAPP
        );
        
        if (existingCustomer) {
          // Update the existing customer with fresh profile data
          return await this.updateCustomerProfileFromWhatsApp(existingCustomer, instance);
        }
      }
      
      // Fallback: create customer with minimal data
      const fallbackData: CreateCustomerDto = {
        platformId: remoteJid,
        platform: CustomerPlatform.WHATSAPP,
        contact: remoteJid.includes('@') ? remoteJid.split('@')[0] : remoteJid,
        priority: 0,
        isGroup: remoteJid.includes('@g.us'),
        type: 'contact' as any,
        status: 'active' as any,
        tags: [],
      };

      const fallbackCustomer = await this.customerService.createCustomer(fallbackData);
      // Fetch customer with tags
      return await this.customerService.findCustomerByIdWithTags(fallbackCustomer.id);
    }
  }

  /**
   * Create WhatsApp queue entry for customer
   */
  private async createQueueEntryForCustomer(customerId: string, instance: string, remoteJid?: string, customer?: Customer): Promise<void> {
    try {
      const sessionId = randomUUID();
      
      const queueData: CreateQueueWhatsAppDto = {
        sessionId,
        customerId,
        customer,
        userId: 'system', // Default system user - you might want to assign to a specific agent
        metadata: {
          instance,
          remoteJid,
        },
      };

      await this.queueService.createQueueWhatsApp(queueData);

      this.logger.log(`Created WhatsApp queue entry for customer: ${customerId} with session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error creating WhatsApp queue entry for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Process the actual message content - implement your business logic here
   */
  private async processMessageContent(customer: Customer, event: EvolutionMessagesUpsertEvent): Promise<void> {
    try {
      // Extract message content
      const messageData = event.data;
      const messageText = messageData.message?.conversation || messageData.message?.imageMessage?.caption ||messageData.message?.videoMessage?.caption || '';

      this.logger.log(`Processing message from customer ${customer.id}: ${messageText.substring(0, 100)}...`);

      // Get the queue session for this customer
      const queue = await this.queueService.findQueueByCustomerId(customer.id);
      
      // Store message using the platform-agnostic message storage service
      const lastMessage = await this.messageStorageService.storePlatformMessage(
        {
          data: messageData,
          customer,
          event,
        },
        MessagePlatform.WHATSAPP,
        queue.sessionId
      );
      
      await this.queueService.updateLastMessage(queue.sessionId, lastMessage.redisMessage);

      this.logger.debug(`Message processed and stored for customer ${customer.displayName}: ${messageText}`);
      
    } catch (error) {
      this.logger.error(`Error processing message content for customer ${customer.id}:`, error);
      throw error;
    }
  }

  /**
   * Log event to individual file in JSONL format (one JSON object per line)
   * Each event type gets its own file for better organization
   */
  private logToFile(eventType: string, event: any): void {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        event,
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      const logFilePath = path.join(this.logsDir, `${eventType.toLowerCase()}.jsonl`);
      
      fs.appendFileSync(logFilePath, logLine, 'utf8');
      
      this.logger.debug(`Event logged to ${logFilePath}`);
    } catch (error) {
      this.logger.error('Error writing to log file:', error);
    }
  }
}
