import { Injectable, Logger } from '@nestjs/common';
import { 
  InboundMessageWebhookDto, 
  StatusWebhookDto,
  SandboxInboundMessageWebhookDto,
  SandboxStatusWebhookDto 
} from '../dto/vonage.dto';
import { VonageInboundMessageWebhook, VonageStatusWebhook } from '../interfaces/vonage.interface';
import { CustomerService } from '../../../customer/customer.service';
import { QueueService } from '../../../customer-queue/queue.service';
import { MessageStorageService } from '../../../messages/message-storage.service';
import { Customer, CustomerPlatform, CustomerStatus, CustomerType } from '../../../customer/entities/customer.entity';
import { MessagePlatform, MessageType, MessageStatus, SenderType, RecipientType } from '../../../messages/entities/message.entity';
import { CreateCustomerDto } from '../../../customer/dto/customer.dto';
import { CreateQueueWhatsAppDto } from '../../../customer-queue/dto/queue.dto';
import { MessagesService } from '../../../messages/messages.service';
import { AddReactionDto } from '../../../messages/dto/message.dto';
import { randomUUID } from 'crypto';

/**
 * Vonage Webhook Service
 * Handles processing of webhook events from Vonage WhatsApp Business API
 * Migrated from legacy vonage.js logic
 */
@Injectable()
export class VonageWebhookService {
  private readonly logger = new Logger(VonageWebhookService.name);
  
  // Blacklist of phone numbers to ignore
  private readonly blacklist = ['5518981483339'];

  constructor(
    private readonly customerService: CustomerService,
    private readonly queueService: QueueService,
    private readonly messageStorageService: MessageStorageService,
    private readonly messagesService: MessagesService,
  ) {}

  /**
   * Process inbound message webhook
   * Follows the same queue logic as Evolution message processor
   */
  async processInboundMessage(webhookData: InboundMessageWebhookDto): Promise<void> {
    try {
      this.logger.log(`Processing inbound message: ${webhookData.message_uuid}`);
      
      // Extract contact information from the webhook
      const contactUid = this.extractContactUid(webhookData);
      
      if (!contactUid) {
        this.logger.warn('No contact UID found in webhook data, skipping customer processing');
        return;
      }

      // Check blacklist
      if (this.blacklist.includes(contactUid)) {
        this.logger.log(`Contact ${contactUid} is in blacklist, ignoring message`);
        return;
      }
      
      // Skip status messages
      if (contactUid.indexOf('status') >= 0) {
        this.logger.log('Skipping status message');
        return;
      }
      
      // Handle group messages
      if (contactUid.indexOf('g.us') > -1) {
        await this.handleGroupMessage(contactUid);
        return;
      }

      // Process customer and queue management (same logic as Evolution)
      await this.processCustomerMessage(contactUid, webhookData);
      
      this.logger.log(`Successfully processed inbound message for customer: ${contactUid}`);
      
    } catch (error) {
      this.logger.error('Error processing inbound message:', error);
      throw error;
    }
  }

  /**
   * Process status webhook
   * Handles message status updates from Vonage
   */
  async processStatusUpdate(webhookData: StatusWebhookDto): Promise<void> {
    try {
      this.logger.log(`Processing status update: ${webhookData.message_uuid} - ${webhookData.status}`);
      
      // Extract message ID from webhook data
      const messageId = webhookData.message_uuid;
      
      if (!messageId) {
        this.logger.warn('No message ID found in status webhook, skipping processing');
        return;
      }

      // Handle the message status update using the message storage service
      await this.messageStorageService.handleMessageUpdate(messageId, webhookData.status);
      
      this.logger.log(`Successfully processed status update for message: ${messageId} with status: ${webhookData.status}`);
      
    } catch (error) {
      this.logger.error('Error processing status update:', error);
      throw error;
    }
  }

  /**
   * Process customer message - main workflow implementation
   * Follows the same logic as Evolution message processor
   */
  private async processCustomerMessage(
    contactUid: string, 
    webhookData: InboundMessageWebhookDto
  ): Promise<void> {
    try {
      // Step 1: Check if customer already exists
      let customer = await this.customerService.findCustomerByPlatformIdWithTags(
        contactUid, 
        CustomerPlatform.WHATSAPP
      );

      // Step 2: If customer doesn't exist, create one
      if (!customer) {
        this.logger.log(`Customer not found for ${contactUid}, creating new customer`);
        customer = await this.createCustomerFromVonage(contactUid, webhookData);
      } else {
        this.logger.log(`Customer found for ${contactUid} with ${customer.tags?.length || 0} tags`);
      }

      // Step 3: Check if customer is already in queue
      const isInQueue = await this.queueService.isCustomerInQueue(customer.id);
      const isInService = await this.queueService.isCustomerInService(customer.id);

      // Step 4: If not in queue or service, create queue entry
      if (!isInQueue && !isInService) {
        this.logger.log(`Customer ${customer.id} not in queue, creating queue entry`);
        
        await this.createQueueEntryForCustomer(customer.id, contactUid, customer);
      } else {
        this.logger.log(`Customer ${customer.id} already in queue/service, skipping queue creation`);
      }

      // Step 5: Process the actual message
      await this.processMessageContent(customer, webhookData);

    } catch (error) {
      this.logger.error(`Error processing customer message for ${contactUid}:`, error);
      throw error;
    }
  }

  /**
   * Create customer from Vonage webhook data
   */
  private async createCustomerFromVonage(contactUid: string, webhookData: InboundMessageWebhookDto): Promise<Customer> {
    try {
      console.log('[DEBUG] createCustomerFromVonage called with:');
      console.log('[DEBUG] contactUid:', contactUid);
      console.log('[DEBUG] webhookData:', {
        message_uuid: webhookData.message_uuid,
        from: webhookData.from,
        to: webhookData.to,
        timestamp: webhookData.timestamp,
        direction: webhookData.direction,
      });

      // Extract customer data from webhook
      const customerData: CreateCustomerDto = {
        platformId: contactUid,
        platform: CustomerPlatform.WHATSAPP,
        pushName: undefined, // Vonage doesn't provide profile name in webhook
        name: undefined,
        profilePicUrl: undefined,
        contact: contactUid.includes('@') ? contactUid.split('@')[0] : contactUid,
        priority: 0, // Default priority
        isGroup: contactUid.includes('@g.us'), // Check if it's a group
        type: CustomerType.CONTACT,
        status: CustomerStatus.ACTIVE,
        tags: [], // Default empty tags
      };

      console.log('[DEBUG] Extracted customer data:', {
        platformId: customerData.platformId,
        contact: customerData.contact,
        isGroup: customerData.isGroup,
        platform: customerData.platform,
        type: customerData.type,
        status: customerData.status,
      });

      this.logger.log(`Creating customer with data:`, {
        platformId: customerData.platformId,
        contact: customerData.contact,
        isGroup: customerData.isGroup
      });

      // Create customer
      const customer = await this.customerService.createCustomer(customerData);
      console.log('[DEBUG] Customer created successfully:', {
        id: customer.id,
        platformId: customer.platformId,
        contact: customer.contact,
        isGroup: customer.isGroup,
      });
      this.logger.log(`Created new customer: ${customer.id} for ${contactUid}`);
      
      // Fetch customer with tags
      const customerWithTags = await this.customerService.findCustomerByIdWithTags(customer.id);
      console.log('[DEBUG] Customer with tags:', {
        id: customerWithTags.id,
        platformId: customerWithTags.platformId,
        contact: customerWithTags.contact,
        isGroup: customerWithTags.isGroup,
        tags: customerWithTags.tags?.length || 0,
      });
      
      return customerWithTags;
    } catch (error) {
      console.error('[ERROR] Error creating customer:', error);
      this.logger.error(`Error creating customer for ${contactUid}:`, error);
      
      // Check if it's a duplicate customer error
      if (error.status === 409 || error.message?.includes('already exists')) {
        this.logger.log(`Customer already exists for ${contactUid}, fetching existing customer`);
        // Try to find the existing customer
        const existingCustomer = await this.customerService.findCustomerByPlatformId(
          contactUid, 
          CustomerPlatform.WHATSAPP
        );
        
        if (existingCustomer) {
          console.log('[DEBUG] Found existing customer:', {
            id: existingCustomer.id,
            platformId: existingCustomer.platformId,
            contact: existingCustomer.contact,
          });
          return await this.customerService.findCustomerByIdWithTags(existingCustomer.id);
        }
      }
      
      throw error;
    }
  }

  /**
   * Create WhatsApp queue entry for customer
   */
  private async createQueueEntryForCustomer(customerId: string, contactUid: string, customer?: Customer): Promise<void> {
    try {
      const sessionId = randomUUID();
      
      const queueData: CreateQueueWhatsAppDto = {
        sessionId,
        customerId,
        customer,
        userId: 'system', // Default system user - you might want to assign to a specific agent
        metadata: {
          platform: 'vonage',
          contactUid,
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
   * Process the actual message content
   */
  private async processMessageContent(customer: Customer, webhookData: InboundMessageWebhookDto): Promise<void> {
    try {
      // Extract message content
      const messageText = this.extractMessageText(webhookData);

      this.logger.log(`Processing message from customer ${customer.id}: ${messageText.substring(0, 100)}...`);

      // Get the queue session for this customer
      const queue = await this.queueService.findQueueByCustomerId(customer.id);
      
      // Store message using the platform-agnostic message storage service
      const lastMessage = await this.messageStorageService.storePlatformMessage(
        {
          data: webhookData,
          customer,
          platform: 'vonage',
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
   * Extract message text from webhook data
   */
  private extractMessageText(webhookData: InboundMessageWebhookDto): string {
    const content = webhookData.message.content;
    
    switch (content.type) {
      case 'text':
        return content.text || '';
      case 'image':
        return content.image?.caption || '';
      case 'video':
        return content.video?.caption || '';
      case 'file':
        return content.file?.caption || '';
      case 'button':
        return content.button?.text || '';
      default:
        return '';
    }
  }

  /**
   * Extract contact UID from webhook data
   */
  private extractContactUid(webhookData: InboundMessageWebhookDto): string {
    return webhookData.from;
  }

  /**
   * Handle group messages
   */
  private async handleGroupMessage(contactUid: string): Promise<void> {
    const groupId = contactUid.substring(0, contactUid.search('-'));
    await this.onRefuseGroup(groupId);
  }

  /**
   * Handle group refusal
   */
  private async onRefuseGroup(groupId: string): Promise<void> {
    this.logger.log(`Refusing group message from group: ${groupId}`);
    // TODO: Implement group refusal logic
  }

  /**
   * Process sandbox inbound message webhook
   * Handles the different webhook structure used in sandbox/development mode
   */
  async processSandboxInboundMessage(webhookData: SandboxInboundMessageWebhookDto): Promise<void> {
    try {
      this.logger.log(`Processing sandbox inbound message: ${webhookData.message_uuid}`);
      
      // Extract contact information from the webhook
      const contactUid = webhookData.from;
      
      if (!contactUid) {
        this.logger.warn('No contact UID found in sandbox webhook data, skipping customer processing');
        return;
      }

      // Check blacklist
      if (this.blacklist.includes(contactUid)) {
        this.logger.log(`Contact ${contactUid} is in blacklist, ignoring message`);
        return;
      }
      
      // Skip status messages
      if (contactUid.indexOf('status') >= 0) {
        this.logger.log('Skipping status message');
        return;
      }
      
      // Handle group messages
      if (contactUid.indexOf('g.us') > -1) {
        await this.handleGroupMessage(contactUid);
        return;
      }

      // Process customer and queue management
      await this.processSandboxCustomerMessage(contactUid, webhookData);
      
      this.logger.log(`Successfully processed sandbox inbound message for customer: ${contactUid}`);
      
    } catch (error) {
      this.logger.error('Error processing sandbox inbound message:', error);
      throw error;
    }
  }

  /**
   * Process sandbox status webhook
   * Handles message status updates from Vonage sandbox
   */
  async processSandboxStatusUpdate(webhookData: SandboxStatusWebhookDto): Promise<void> {
    try {
      this.logger.log(`Processing sandbox status update: ${webhookData.message_uuid} - ${webhookData.status}`);
      
      // Extract message ID from webhook data
      const messageId = webhookData.message_uuid;
      
      if (!messageId) {
        this.logger.warn('No message ID found in sandbox status webhook, skipping processing');
        return;
      }

      // Handle the message status update using the message storage service
      await this.messageStorageService.handleMessageUpdate(messageId, webhookData.status);
      
      this.logger.log(`Successfully processed sandbox status update for message: ${messageId} with status: ${webhookData.status}`);
      
    } catch (error) {
      this.logger.error('Error processing sandbox status update:', error);
      throw error;
    }
  }

  /**
   * Process sandbox customer message - main workflow implementation
   */
  private async processSandboxCustomerMessage(
    contactUid: string, 
    webhookData: SandboxInboundMessageWebhookDto
  ): Promise<void> {
    try {
      // Step 1: Check if customer already exists
      let customer = await this.customerService.findCustomerByPlatformIdWithTags(
        contactUid, 
        CustomerPlatform.WHATSAPP
      );

      // Step 2: If customer doesn't exist, create one
      if (!customer) {
        this.logger.log(`Customer not found for ${contactUid}, creating new customer`);
        customer = await this.createCustomerFromSandbox(contactUid, webhookData);
      } else {
        this.logger.log(`Customer found for ${contactUid} with ${customer.tags?.length || 0} tags`);
      }

      // Step 3: Check if customer is already in queue
      const isInQueue = await this.queueService.isCustomerInQueue(customer.id);
      const isInService = await this.queueService.isCustomerInService(customer.id);

      // Step 4: If not in queue or service, create queue entry
      if (!isInQueue && !isInService) {
        this.logger.log(`Customer ${customer.id} not in queue, creating queue entry`);
        
        await this.createQueueEntryForCustomer(customer.id, contactUid, customer);
      } else {
        this.logger.log(`Customer ${customer.id} already in queue/service, skipping queue creation`);
      }

      // Step 5: Process the actual message
      await this.processSandboxMessageContent(customer, webhookData);

    } catch (error) {
      this.logger.error(`Error processing sandbox customer message for ${contactUid}:`, error);
      throw error;
    }
  }

  /**
   * Create customer from sandbox webhook data
   */
  private async createCustomerFromSandbox(contactUid: string, webhookData: SandboxInboundMessageWebhookDto): Promise<Customer> {
    try {
      console.log('[DEBUG] createCustomerFromSandbox called with:');
      console.log('[DEBUG] contactUid:', contactUid);
      console.log('[DEBUG] webhookData:', {
        message_uuid: webhookData.message_uuid,
        from: webhookData.from,
        to: webhookData.to,
        timestamp: webhookData.timestamp,
        message_type: webhookData.message_type,
      });

      // Extract customer data from webhook
      const customerData: CreateCustomerDto = {
        platformId: contactUid,
        platform: CustomerPlatform.WHATSAPP,
        pushName: undefined, // Sandbox doesn't provide profile name in webhook
        name: undefined,
        profilePicUrl: undefined,
        contact: contactUid.includes('@') ? contactUid.split('@')[0] : contactUid,
        priority: 0, // Default priority
        isGroup: contactUid.includes('@g.us'), // Check if it's a group
        type: CustomerType.CONTACT,
        status: CustomerStatus.ACTIVE,
        tags: [], // Default empty tags
      };

      console.log('[DEBUG] Extracted sandbox customer data:', {
        platformId: customerData.platformId,
        contact: customerData.contact,
        isGroup: customerData.isGroup,
        platform: customerData.platform,
        type: customerData.type,
        status: customerData.status,
      });

      this.logger.log(`Creating customer from sandbox with data:`, {
        platformId: customerData.platformId,
        contact: customerData.contact,
        isGroup: customerData.isGroup
      });

      // Create customer
      const customer = await this.customerService.createCustomer(customerData);
      console.log('[DEBUG] Sandbox customer created successfully:', {
        id: customer.id,
        platformId: customer.platformId,
        contact: customer.contact,
        isGroup: customer.isGroup,
      });
      this.logger.log(`Created new customer from sandbox: ${customer.id} for ${contactUid}`);
      
      // Fetch customer with tags
      const customerWithTags = await this.customerService.findCustomerByIdWithTags(customer.id);
      console.log('[DEBUG] Sandbox customer with tags:', {
        id: customerWithTags.id,
        platformId: customerWithTags.platformId,
        contact: customerWithTags.contact,
        isGroup: customerWithTags.isGroup,
        tags: customerWithTags.tags?.length || 0,
      });
      
      return customerWithTags;
    } catch (error) {
      console.error('[ERROR] Error creating sandbox customer:', error);
      this.logger.error(`Error creating customer from sandbox for ${contactUid}:`, error);
      
      // Check if it's a duplicate customer error
      if (error.status === 409 || error.message?.includes('already exists')) {
        this.logger.log(`Customer already exists for ${contactUid}, fetching existing customer`);
        // Try to find the existing customer
        const existingCustomer = await this.customerService.findCustomerByPlatformId(
          contactUid, 
          CustomerPlatform.WHATSAPP
        );
        
        if (existingCustomer) {
          console.log('[DEBUG] Found existing sandbox customer:', {
            id: existingCustomer.id,
            platformId: existingCustomer.platformId,
            contact: existingCustomer.contact,
          });
          return await this.customerService.findCustomerByIdWithTags(existingCustomer.id);
        }
      }
      
      throw error;
    }
  }

  /**
   * Process the actual sandbox message content
   */
  private async processSandboxMessageContent(customer: Customer, webhookData: SandboxInboundMessageWebhookDto): Promise<void> {
    try {
      // Handle reactions as reaction records (not messages)
      if (webhookData.message_type === 'reaction') {
        const originalMessageId = webhookData.context?.message_uuid;
        const action = webhookData.reaction?.action;
        const emoji = webhookData.reaction?.emoji;

        if (!originalMessageId) {
          this.logger.warn('Reaction webhook missing context.message_uuid; skipping reaction handling');
          return;
        }

        if (action === 'react' && emoji) {
          const addReactionDto: AddReactionDto = {
            messageId: originalMessageId,
            reactorId: customer.id,
            emoji,
          };
          await this.messagesService.addReaction(addReactionDto);
          
          // Update Redis with new reactions
          const queue = await this.queueService.findQueueByCustomerId(customer.id);
          if (queue) {
            await this.messageStorageService.updateMessageReactionsInRedis(queue.sessionId, originalMessageId);
          }
          
          this.logger.log(`Added reaction ${emoji} from ${customer.id} to message ${originalMessageId}`);
          return; // Do not store reaction as a message
        }

        if (action === 'unreact') {
          await this.messagesService.deleteReaction(originalMessageId, customer.id);
          
          // Update Redis with updated reactions
          const queue = await this.queueService.findQueueByCustomerId(customer.id);
          if (queue) {
            await this.messageStorageService.updateMessageReactionsInRedis(queue.sessionId, originalMessageId);
          }
          
          this.logger.log(`Removed reaction from ${customer.id} on message ${originalMessageId}`);
          return; // Do not store reaction as a message
        }

        // Unknown reaction action; skip storing
        this.logger.warn(`Unknown reaction action: ${action}; skipping`);
        return;
      }

      // Extract message content
      const messageText = this.extractSandboxMessageText(webhookData);

      this.logger.log(`Processing sandbox message from customer ${customer.id}: ${messageText.substring(0, 100)}...`);

      // Get the queue session for this customer
      const queue = await this.queueService.findQueueByCustomerId(customer.id);
      
      // Store message using the platform-agnostic message storage service
      const lastMessage = await this.messageStorageService.storePlatformMessage(
        {
          data: webhookData,
          customer,
          platform: 'vonage-sandbox',
        },
        MessagePlatform.WHATSAPP,
        queue.sessionId
      );
      
      await this.queueService.updateLastMessage(queue.sessionId, lastMessage.redisMessage);

      this.logger.debug(`Sandbox message processed and stored for customer ${customer.displayName}: ${messageText}`);
      
    } catch (error) {
      this.logger.error(`Error processing sandbox message content for customer ${customer.id}:`, error);
      throw error;
    }
  }

  /**
   * Extract message text from sandbox webhook data
   */
  private extractSandboxMessageText(webhookData: SandboxInboundMessageWebhookDto): string {
    switch (webhookData.message_type) {
      case 'text':
        return webhookData.text || '';
      case 'button':
        return webhookData.text || ''; // Button text is stored in text field for sandbox
      case 'image':
        return webhookData.image?.caption || '';
      case 'video':
        return webhookData.video?.caption || '';
      case 'file':
        return webhookData.file?.caption || '';
      case 'document':
        return webhookData.message?.body?.caption || '';
      case 'ptt':
        return webhookData.message?.body?.caption || '';
      case 'vcard':
        return webhookData.message?.body?.contact || '';
      case 'location':
        return webhookData.message?.body?.name || '';
      case 'sticker':
        return 'Sticker message';
      case 'audio':
        return 'Audio message';
      default:
        return '';
    }
  }
}
