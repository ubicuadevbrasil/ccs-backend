import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { QueuesService } from '../queues/queues.service';
import { EvolutionService } from '../evolution/evolution.service';
import { SocketService } from '../socket/socket.service';
import {
  EvolutionWebhookDto,
  isMessagesUpsertData,
  isMessagesUpdateData,
  isMessagesDeleteData,
  isConnectionUpdateData,
  isGroupParticipantsUpdateData,
  isGroupUpdateData,
  isGroupsUpsertData,
  isSendMessageData,
  isTypebotStartData,
  isTypebotChangeStatusData,
  MessagesUpsertDataDto,
  MessagesUpdateDataDto,
  SendMessageDataDto,
  TypebotStartDataDto,
  TypebotChangeStatusDataDto,
  TypebotSessionDto,
  TypebotInstanceDto,
  TypebotDataDto,
  TypebotQueueMetadataDto,
  TypebotQueueUpdateDto,
  TypebotFlowResponseDto,
  WebhookResponseDto
} from './dto/webhook.dto';
import { MessageFrom, MessageDirection, MessageStatus } from '../messages/interfaces/message.interface';
import { QueueStatus, Department } from '../queues/interfaces/queue.interface';
import { GroupService } from '../group/group.service';
import { TypebotService } from '../typebot/typebot.service';
import { randomUUID } from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly queuesService: QueuesService,
    private readonly evolutionService: EvolutionService,
    private readonly socketService: SocketService,
    private readonly groupService: GroupService,
    private readonly typebotService: TypebotService,
  ) { }

  async processEvolutionMessage(webhookData: EvolutionWebhookDto): Promise<WebhookResponseDto> {
    this.logger.log(`Processing Evolution message: ${webhookData?.event} for instance ${webhookData?.instance}`);

    // Validate basic webhook structure
    if (!webhookData || !webhookData.event || !webhookData.instance) {
      this.logger.error('Invalid webhook data structure:', webhookData);
      return { success: false, message: 'Invalid webhook data structure' };
    }

    // Route to appropriate handler based on event type
    // Note: Group messages (messages.upsert with @g.us) skip queue logic
    switch (webhookData.event) {
      case 'messages.upsert':
        return await this.handleMessagesUpsert(webhookData);

      case 'messages.update':
        return await this.handleMessagesUpdate(webhookData);

      case 'messages.delete':
        return await this.handleMessagesDelete(webhookData);

      case 'connection.update':
        return await this.handleConnectionUpdate(webhookData);

      case 'group-participants.update':
        // return await this.handleGroupParticipantsUpdate(webhookData);
        return { success: true, message: 'Group participants updated' };
      case 'group.update':
        return await this.handleGroupUpdate(webhookData);

      case 'groups.upsert':
        return await this.handleGroupsUpsert(webhookData);

      case 'send.message':
        return await this.handleSendMessage(webhookData);

      case 'typebot.start':
        return await this.handleTypebotStart(webhookData);

      case 'typebot.change.status':
        return await this.handleTypebotChangeStatus(webhookData);

      default:
        this.logger.log(`Ignoring unsupported event: ${webhookData.event}`);
        return { success: false, message: 'Unsupported event type' };
    }
  }

  /**
   * Helper method to detect if a message is from a group
   */
  private isGroupMessage(remoteJid: string): boolean {
    return remoteJid.includes('@g.us');
  }

  /**
   * Helper method to extract phone number from JID
   */
  private extractPhoneFromJid(jid: string): string {
    return jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
  }

  /**
   * Helper method to check if a customer is currently in service
   */
  private async isCustomerInService(customerPhone: string): Promise<boolean> {
    try {
      const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);
      return queue?.status === QueueStatus.SERVICE;
    } catch (error) {
      this.logger.error(`Error checking if customer ${customerPhone} is in service:`, error);
      return false;
    }
  }

  private async handleMessagesUpsert(webhookData: EvolutionWebhookDto): Promise<WebhookResponseDto> {
    const { data, instance } = webhookData;

    if (!isMessagesUpsertData(data)) {
      this.logger.error('Invalid data structure for messages.upsert event:', data);
      return { success: false, message: 'Invalid data structure' };
    }

    if (!data.key || !data.key.remoteJid) {
      this.logger.error('Invalid key structure for messages.upsert event:', data);
      return { success: false, message: 'Invalid key structure' };
    }

    const customerPhone = this.extractPhoneFromJid(data.key.remoteJid);
    const isFromMe = data.key.fromMe || false;
    const isGroupMessage = this.isGroupMessage(data.key.remoteJid);

    this.logger.log(`Processing messages.upsert from ${customerPhone}, fromMe: ${isFromMe}, isGroup: ${isGroupMessage}`);

    try {

      const { isOpen } = await this.typebotService.checkBusinessHours();

      // Process the message through MessagesService for all messages (including group messages)
      const message = await this.messagesService.processEvolutionApiMessage({
        event: webhookData.event,
        instance: webhookData.instance,
        data: {
          key: data.key,
          pushName: data.pushName || '',
          message: data.message || {},
          messageType: data.messageType || 'unknown',
          messageTimestamp: data.messageTimestamp || Date.now(),
          owner: data.owner || '',
          source: data.source || '',
        },
        destination: webhookData.destination || '',
        date_time: webhookData.date_time || new Date().toISOString(),
        sender: webhookData.sender || '',
        apikey: webhookData.apikey || '',
        isOpen,
      });

      if (!message) {
        this.logger.warn(`Failed to process message for ${customerPhone}`);
        return { success: false, message: 'Message processing failed' };
      }


      // Handle queue management and business logic only for non-group messages
      if (!isFromMe && !isGroupMessage && isOpen) {
        await this.handleQueueManagement(customerPhone, data, instance, message);
        await this.handleBusinessLogic(customerPhone, data, instance, message);

        // Send socket message to operators if customer is in service
        const isInService = await this.isCustomerInService(customerPhone);
        if (isInService) {
          this.logger.log(`Sending socket message for customer in service: ${customerPhone}`);
          try {
            await this.socketService.handleWebhookEvent({
              event: webhookData.event,
              instance: webhookData.instance,
              data: data,
            });
          } catch (socketError) {
            this.logger.error(`Error sending socket message for ${customerPhone}:`, socketError);
            // Don't fail the webhook processing if socket fails
          }
        }
      }

      // For group messages, broadcast to all operators without queue processing
      if (isGroupMessage) {
        this.logger.log(`Group message processed and stored in messages table for ${customerPhone} in group ${data.key.remoteJid}`);

        // Broadcast group message to all connected operators
        this.logger.log(`Broadcasting group message from ${customerPhone} in group ${data.key.remoteJid} to all operators`);
        try {
          await this.socketService.handleWebhookEvent({
            event: webhookData.event,
            instance: webhookData.instance,
            data: data,
          });
        } catch (socketError) {
          this.logger.error(`Error broadcasting group message from ${customerPhone}:`, socketError);
          // Don't fail the webhook processing if socket fails
        }
      }

      return {
        success: true,
        message: isGroupMessage ? 'Group message processed and stored' : 'Message processed successfully',
        data: {
          messageId: message.id,
          sessionId: message.sessionId,
          customerPhone,
          fromMe: isFromMe,
          isGroupMessage,
          groupJid: isGroupMessage ? data.key.remoteJid : undefined,
          event: 'messages.upsert',
        }
      };

    } catch (error) {
      this.logger.error(`Error processing messages.upsert: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to process messages.upsert: ${error.message}`);
    }
  }

  private async handleMessagesUpdate(webhookData: EvolutionWebhookDto): Promise<WebhookResponseDto> {
    this.logger.log(`Processing messages.update for instance ${webhookData.instance}`);

    // Handle message updates (delivery receipts, read receipts, etc.)
    try {
      const { data, instance } = webhookData;

      // Handle different data structures for messages.update
      const updateData = data as any;
      let messageId: string;
      let status: string;

      if (updateData.keyId) {
        // Use keyId as the primary identifier
        messageId = updateData.keyId;
        status = updateData.status || 'unknown';
      } else if (updateData.key && updateData.key.id) {
        // Standard structure
        messageId = updateData.key.id;
        status = updateData.updateStatus || 'unknown';
      } else if (updateData.messageId) {
        // Alternative structure
        messageId = updateData.messageId;
        status = updateData.status || 'unknown';
      } else {
        this.logger.error('Invalid data structure for messages.update event:', data);
        return { success: false, message: 'Invalid data structure' };
      }

      // Map status string to MessageStatus enum
      let messageStatus: MessageStatus;
      switch (status.toLowerCase()) {
        case 'delivery_ack':
        case 'delivered':
          messageStatus = MessageStatus.DELIVERED;
          break;
        case 'read':
        case 'played':
          messageStatus = MessageStatus.READ;
          break;
        case 'server_ack':
        case 'sent':
          messageStatus = MessageStatus.SENT;
          break;
        case 'failed':
          messageStatus = MessageStatus.FAILED;
          break;
        default:
          messageStatus = MessageStatus.PENDING;
      }

      // Update message status based on update type using Evolution message ID
      await this.messagesService.updateMessageStatusByEvolutionId(messageId, messageStatus);

      // Send socket message to operators if customer is in service
      // We need to extract customer phone from the update data if available
      let customerPhone: string | null = null;

      if (updateData.key?.remoteJid) {
        customerPhone = this.extractPhoneFromJid(updateData.key.remoteJid);
      } else if (updateData.remoteJid) {
        customerPhone = this.extractPhoneFromJid(updateData.remoteJid);
      }

      if (customerPhone) {
        const remoteJid = updateData.key?.remoteJid || updateData.remoteJid || '';
        const isGroupMsg = this.isGroupMessage(remoteJid);

        if (isGroupMsg) {
          // Broadcast group message updates to all operators
          this.logger.log(`Broadcasting group message update from ${customerPhone} in group ${remoteJid} to all operators`);
          try {
            await this.socketService.handleWebhookEvent({
              event: webhookData.event,
              instance: webhookData.instance,
              data: updateData,
            });
          } catch (socketError) {
            this.logger.error(`Error broadcasting group message update from ${customerPhone}:`, socketError);
            // Don't fail the webhook processing if socket fails
          }
        } else {
          // Handle individual customer message updates (existing logic)
          const isInService = await this.isCustomerInService(customerPhone);
          if (isInService) {
            this.logger.log(`Sending socket message for message update - customer in service: ${customerPhone}`);
            try {
              await this.socketService.handleWebhookEvent({
                event: webhookData.event,
                instance: webhookData.instance,
                data: updateData,
              });
            } catch (socketError) {
              this.logger.error(`Error sending socket message for message update ${customerPhone}:`, socketError);
              // Don't fail the webhook processing if socket fails
            }
          }
        }
      }

      return {
        success: true,
        message: 'Message update processed successfully',
        data: {
          messageId,
          event: 'messages.update',
          updateType: status,
        }
      };

    } catch (error) {
      this.logger.error(`Error processing messages.update: ${error.message}`, error.stack);
      return { success: false, message: 'Message update processing failed' };
    }
  }

  private async handleMessagesDelete(webhookData: any): Promise<any> {
    this.logger.log(`Processing messages.delete for instance ${webhookData.instance}`);

    try {
      const { data } = webhookData;

      if (!data || (!data.keyId && (!data.key || !data.key.id))) {
        this.logger.error('Invalid data structure for messages.delete event:', data);
        return { processed: false, reason: 'Invalid data structure' };
      }

      const messageId = data.keyId || data.key.id;

      // Handle message deletion
      await this.messagesService.deleteMessage(messageId);

      return {
        processed: true,
        messageId,
        event: 'messages.delete',
      };

    } catch (error) {
      this.logger.error(`Error processing messages.delete: ${error.message}`, error.stack);
      return { processed: false, reason: 'Message deletion processing failed' };
    }
  }

  private async handleConnectionUpdate(webhookData: any): Promise<any> {
    this.logger.log(`Processing connection.update for instance ${webhookData.instance}`);

    try {
      const { data, instance } = webhookData;

      if (!data || !data.state) {
        this.logger.error('Invalid data structure for connection.update event:', data);
        return { processed: false, reason: 'Invalid data structure' };
      }

      // Handle connection state changes
      this.logger.log(`Connection state changed for ${instance}: ${data.state}`);

      return {
        processed: true,
        instance,
        event: 'connection.update',
        state: data.state,
      };

    } catch (error) {
      this.logger.error(`Error processing connection.update: ${error.message}`, error.stack);
      return { processed: false, reason: 'Connection update processing failed' };
    }
  }

  private async handleGroupParticipantsUpdate(webhookData: any): Promise<any> {
    this.logger.log(`Processing group.participants.update for instance ${webhookData.instance}`);

    try {
      const { data, instance } = webhookData;

      if (!data || !data.id) {
        this.logger.error('Invalid data structure for group.participants.update event:', data);
        return { processed: false, reason: 'Invalid data structure' };
      }

      // Handle group participants updates
      this.logger.log(`Group participants updated for ${instance}: ${data.id}`);

      let systemMessage = '';
      if (data.action === 'add') {
        systemMessage = `${data.participants[0].replace('@s.whatsapp.net', '')} entrou no grupo`;
      } else if (data.action === 'remove') {
        systemMessage = `${data.participants[0].replace('@s.whatsapp.net', '')} foi removido do grupo`;
      }

      this.groupService.createSystemMessage(instance, data.id, systemMessage, undefined, 'group-participants.update');
      await this.groupService.syncGroupParticipants(instance, data.id);

      return {
        processed: true,
        instance,
        event: 'group-participants.update',
        groupJid: data.id,
        participants: data.participants || [],
      };

    } catch (error) {
      this.logger.error(`Error processing group.participants.update: ${error.message}`, error.stack);
      return { processed: false, reason: 'Group participants update processing failed' };
    }
  }

  private async handleGroupUpdate(webhookData: any): Promise<any> {
    this.logger.log(`Processing group.update for instance ${webhookData.instance}`);

    try {
      const { data, instance } = webhookData;

      if (!data || !data.groupJid) {
        this.logger.error('Invalid data structure for group.update event:', data);
        return { processed: false, reason: 'Invalid data structure' };
      }

      // Handle group updates (subject, description, etc.)
      this.logger.log(`Group updated for ${instance}: ${data.groupJid}`);

      // TODO: Sync group updates to database when group repository is available
      // This would update the groups table with the new group information

      return {
        processed: true,
        instance,
        event: 'group.update',
        groupJid: data.groupJid,
        updateType: data.updateType || 'unknown',
        updateData: data.updateData || {},
      };

    } catch (error) {
      this.logger.error(`Error processing group.update: ${error.message}`, error.stack);
      return { processed: false, reason: 'Group update processing failed' };
    }
  }

  private async handleGroupsUpsert(webhookData: any): Promise<any> {
    this.logger.log(`Processing groups.upsert for instance ${webhookData.instance}`);

    try {
      const { data, instance } = webhookData;

      if (!data || !data.groups) {
        this.logger.error('Invalid data structure for groups.upsert event:', data);
        return { processed: false, reason: 'Invalid data structure' };
      }

      // Handle new groups being created or updated
      this.logger.log(`Groups upsert for ${instance}: ${data.groups.length} groups`);

      // TODO: Sync groups to database when group repository is available
      // This would sync all groups to the groups table

      return {
        processed: true,
        instance,
        event: 'groups.upsert',
        groupsCount: data.groups.length,
        groups: data.groups,
      };

    } catch (error) {
      this.logger.error(`Error processing groups.upsert: ${error.message}`, error.stack);
      return { processed: false, reason: 'Groups upsert processing failed' };
    }
  }

  private async handleSendMessage(webhookData: any): Promise<any> {
    this.logger.log(`Processing send.message for instance ${webhookData.instance}`);

    try {
      const { data, instance } = webhookData;

      // Handle different data structures for send.message
      let messageId: string;
      let customerPhone: string;

      const isGroupMessage = this.isGroupMessage(data.key.remoteJid || '');

      if (data.key && data.key.id) {
        // Alternative structure
        messageId = data.key.id;
        customerPhone = this.extractPhoneFromJid(data.key.remoteJid || '');
      } else {
        this.logger.error('Invalid data structure for send.message event:', data);
        return { processed: false, reason: 'Invalid data structure' };
      }

      // Process and save all send.message events to database
      if (customerPhone) {
        const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

        // Always process and save messages to database regardless of queue status
        this.logger.log(`Processing send.message for user ${customerPhone} (queue status: ${queue?.status || 'no queue'})`);

        // Process the message using the specialized send.message function
        // If there's no queue, we'll still save the message but without queue context
        const message = await this.messagesService.processSendMessageEvent({
          event: webhookData.event,
          instance: webhookData.instance,
          data: {
            key: data.key || { id: messageId, remoteJid: data.remoteJid || data.key?.remoteJid, fromMe: true },
            pushName: data.pushName || '',
            message: data.message || {},
            messageType: data.messageType || 'conversation',
            messageTimestamp: data.messageTimestamp || Date.now(),
            owner: data.owner || '',
            source: data.source || '',
          },
          destination: webhookData.destination || '',
          date_time: webhookData.date_time || new Date().toISOString(),
          sender: webhookData.sender || '',
          apikey: webhookData.apikey || '',
        }, queue?.id);

        if (message) {
          this.logger.log(`Successfully inserted message ${message.id} for user ${customerPhone} (queue status: ${queue?.status || 'no queue'})`);
        } else {
          this.logger.warn(`Failed to insert message for user ${customerPhone} (queue status: ${queue?.status || 'no queue'})`);
        }
      }

      // Handle message sending confirmations
      this.logger.log(`Message sent confirmation for ${instance}: ${messageId}`);

      // Update message status to sent using Evolution message ID
      await this.messagesService.updateMessageStatusByEvolutionId(messageId, MessageStatus.SENT);

      return {
        processed: true,
        instance,
        event: 'send.message',
        messageId,
        status: 'sent',
        customerPhone,
        queueStatus: customerPhone ? (await this.queuesService.findQueueByCustomerPhone(customerPhone))?.status : null,
      };

    } catch (error) {
      this.logger.error(`Error processing send.message: ${error.message}`, error.stack);
      return { processed: false, reason: 'Send message processing failed' };
    }
  }

  private async handleTypebotStart(webhookData: EvolutionWebhookDto): Promise<WebhookResponseDto> {
    this.logger.log(`Processing typebot.start for instance ${webhookData.instance}`);

    try {
      const { data, instance } = webhookData;

      if (!isTypebotStartData(data)) {
        this.logger.error('Invalid data structure for typebot.start event:', data);
        return { success: false, message: 'Invalid data structure' };
      }

      if (!data.typebotId || !data.remoteJid) {
        this.logger.error('Invalid data structure for typebot.start event:', data);
        return { success: false, message: 'Missing required fields' };
      }

      // Handle typebot session start
      this.logger.log(`Typebot started for ${instance}: ${data.typebotId}`);

      // Fetch typebot session data from Evolution API
      let sessionData = null;
      try {
        sessionData = await this.evolutionService.fetchSessions(instance, data.typebotId);
        this.logger.log(`Fetched typebot session data for ${data.typebotId}:`, sessionData);
      } catch (error) {
        this.logger.warn(`Failed to fetch typebot session data for ${data.typebotId}: ${error.message}`);
      }

      // Update queue status to TYPEBOT if needed
      const customerPhone = data.remoteJid.replace('@s.whatsapp.net', '');
      const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

      if (queue && queue.status !== 'typebot') {
        await this.queuesService.updateQueue(queue.id, {
          status: 'typebot' as any,
          typebotData: {
            typebotId: data.typebotId,
            sessionUrl: data.sessionUrl,
            startedAt: new Date().toISOString(),
            sessionData: sessionData, // Include fetched session data
          }
        });
      }

      return {
        success: true,
        message: 'Typebot start processed successfully',
        data: {
          instance,
          event: 'typebot.start',
          typebotId: data.typebotId,
          remoteJid: data.remoteJid,
          sessionData: sessionData,
        }
      };

    } catch (error) {
      this.logger.error(`Error processing typebot.start: ${error.message}`, error.stack);
      return { success: false, message: 'Typebot start processing failed' };
    }
  }

  private async handleTypebotChangeStatus(webhookData: any): Promise<any> {
    this.logger.log(`Processing typebot.change.status for instance ${webhookData.instance}`);

    try {
      const { data, instance } = webhookData;

      if (!data || !data.typebotId || !data.remoteJid || !data.status) {
        this.logger.error('Invalid data structure for typebot.change.status event:', data);
        return { processed: false, reason: 'Invalid data structure' };
      }

      // Handle typebot session status changes
      this.logger.log(`Typebot status changed for ${instance}: ${data.status}`);

      // Fetch updated typebot session data from Evolution API
      let sessionData = null;
      try {
        sessionData = await this.evolutionService.fetchSessions(instance, data.typebotId);
        this.logger.log(`Fetched updated typebot session data for ${data.typebotId}:`, sessionData);
      } catch (error) {
        this.logger.warn(`Failed to fetch updated typebot session data for ${data.typebotId}: ${error.message}`);
      }

      // Update queue based on typebot status
      const customerPhone = data.remoteJid.replace('@s.whatsapp.net', '');
      const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

      if (queue) {
        let newStatus = queue.status;

        switch (data.status) {
          case 'closed':
            newStatus = 'waiting' as any;
            break;
          case 'paused':
            newStatus = 'waiting' as any;
            break;
          case 'opened':
            newStatus = 'typebot' as any;
            break;
        }

        await this.queuesService.updateQueue(queue.id, {
          status: newStatus,
          typebotData: {
            ...queue.typebotData,
            lastStatus: data.status,
            lastStatusChange: new Date().toISOString(),
            sessionData: sessionData, // Include updated session data
          }
        });
      }

      return {
        processed: true,
        instance,
        event: 'typebot.change.status',
        typebotId: data.typebotId,
        status: data.status,
        remoteJid: data.remoteJid,
        sessionData: sessionData,
      };

    } catch (error) {
      this.logger.error(`Error processing typebot.change.status: ${error.message}`, error.stack);
      return { processed: false, reason: 'Typebot status change processing failed' };
    }
  }

  private async handleQueueManagement(
    customerPhone: string,
    messageData: any,
    instance: string,
    message: any
  ): Promise<void> {
    this.logger.log(`Handling queue management for ${customerPhone}`);

    try {
      // Check if there's an existing active queue for this customer
      let queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

      if (!queue) {
        // Create new queue session
        const customerName = messageData.pushName || 'Unknown';

        // Generate a proper UUID for sessionId
        const sessionId = randomUUID();

        queue = await this.queuesService.createQueueFromCustomerPhone(
          sessionId,
          customerPhone,
          instance,
          undefined, // typebotSessionUrl
          {
            firstMessageId: message.id,
            firstMessageTimestamp: messageData.messageTimestamp,
            customerName,
          }
        );

        this.logger.log(`Created new queue session for ${customerPhone}: ${queue.id}`);
      } else {
        this.logger.log(`Found existing queue session for ${customerPhone}: ${queue.id}`);
      }

      // Update message with session ID
      await this.messagesService.updateMessageStatus(message.id, MessageStatus.DELIVERED);

    } catch (error) {
      this.logger.error(`Error in queue management: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleBusinessLogic(
    customerPhone: string,
    messageData: any,
    instance: string,
    message: any
  ): Promise<void> {
    this.logger.log(`Handling business logic for ${customerPhone}`);

    try {
      // Get the current queue for this customer
      const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

      if (!queue) {
        this.logger.warn(`No queue found for customer ${customerPhone}`);
        return;
      }

      // Check if queue is in TYPEBOT status (initial state)
      if (queue.status === QueueStatus.TYPEBOT) {
        await this.handleTypebotFlow(queue, customerPhone, messageData, instance);
      } else if (queue.status === QueueStatus.SERVICE) {
        await this.handleOperatorFlow(queue, customerPhone, messageData, instance);
      } else if (queue.status === QueueStatus.WAITING) {
        await this.handleWaitingFlow(queue, customerPhone, messageData, instance);
      }

    } catch (error) {
      this.logger.error(`Error in business logic: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleTypebotFlow(
    queue: any,
    customerPhone: string,
    messageData: any,
    instance: string
  ): Promise<TypebotFlowResponseDto> {
    this.logger.log(`Handling Typebot flow for ${customerPhone}`);

    try {
      // Step 1: Find typebot instances
      const typebotInstances = await this.evolutionService.findTypebots(instance);
      const unidasTypebot = typebotInstances.find((t: any) => t.typebot === 'unidas-typebot');

      if (!unidasTypebot) {
        this.logger.warn(`No valid typebot found for ${customerPhone}`);
        return {
          success: false,
          customerPhone,
          error: 'No valid typebot found'
        };
      }

      this.logger.log(`Using typebot: ${unidasTypebot.typebot} (ID: ${unidasTypebot.id})`);

      // Step 2: Fetch sessions for the specific typebot and customer
      const sessions = await this.evolutionService.fetchSessions(instance, unidasTypebot.id);
      this.logger.log(`Found ${sessions?.length || 0} sessions for typebot ${unidasTypebot.id}`);

      // Find active session for this customer
      const customerSession = sessions?.find((session: any) =>
        session.remoteJid === `${customerPhone}@s.whatsapp.net` &&
        session.status === 'opened'
      );

      if (!customerSession) {
        this.logger.log(`No active session found for ${customerPhone}, creating new typebot session`);
        return {
          success: false,
          customerPhone,
          typebotId: unidasTypebot.id,
          error: 'No active session found'
        };
      }

      this.logger.log(`Found active session for ${customerPhone}: ${customerSession.sessionId}`);

      // Continue with typebot flow using session data
      this.logger.log(`Continuing typebot flow for ${customerPhone} with session ${customerSession.sessionId}`);

      // Update queue with session information
      await this.queuesService.updateQueue(queue.id, {
        typebotSessionUrl: `${customerSession.parameters.serverUrl}/typebot/fetchSessions/${unidasTypebot.id}/${customerPhone}`,
        typebotData: {
          ...customerSession,
          customerSession,
        },
        metadata: {
          ...queue.metadata,
          lastMessage: messageData,
          lastMessageTimestamp: new Date().toISOString(),
          direction: MessageDirection.INBOUND,
        }
      });

      return {
        success: true,
        customerPhone,
        typebotId: unidasTypebot.id,
        sessionId: customerSession.sessionId,
        sessionStatus: customerSession.status,
        typebotSessionUrl: `${customerSession.parameters.serverUrl}/typebot/fetchSessions/${unidasTypebot.id}/${customerPhone}`
      };

    } catch (error) {
      this.logger.error(`Error handling typebot flow for ${customerPhone}:`, error);

      // Update queue with error information
      await this.queuesService.updateQueue(queue.id, {
        metadata: {
          ...queue.metadata,
          typebotError: error.message,
          typebotErrorTimestamp: new Date().toISOString(),
          lastTypebotMessage: messageData,
          lastTypebotTimestamp: new Date().toISOString(),
        }
      });

      return {
        success: false,
        customerPhone,
        error: error.message
      };
    }
  }

  private async handleOperatorFlow(
    queue: any,
    customerPhone: string,
    messageData: any,
    instance: string
  ): Promise<void> {
    this.logger.log(`Handling Operator flow for ${customerPhone}`);

    // If there's an assigned operator, forward the message to them
    if (queue.assignedOperatorId) {
      this.logger.log(`Forwarding message to operator ${queue.assignedOperatorId}`);

      // Here you would implement operator notification logic
      // This could be through WebSocket, push notification, etc.

      await this.queuesService.updateQueue(queue.id, {
        metadata: {
          ...queue.metadata,
          lastMessage: messageData,
          lastMessageTimestamp: new Date().toISOString(),
          direction: MessageDirection.INBOUND,
        }
      });
    } else {
      this.logger.warn(`No operator assigned to queue ${queue.id}`);
    }
  }

  private async handleWaitingFlow(
    queue: any,
    customerPhone: string,
    messageData: any,
    instance: string
  ): Promise<void> {
    this.logger.log(`Handling Waiting flow for ${customerPhone}`);

    await this.queuesService.updateQueue(queue.id, {
      metadata: {
        ...queue.metadata,
        lastMessage: messageData,
        lastMessageTimestamp: new Date().toISOString(),
        direction: MessageDirection.INBOUND,
      }
    });
  }

  private extractMessageContent(messageData: any): string {
    // Extract text content from different message types
    const messageType = messageData.messageType;
    const message = messageData.message;

    switch (messageType) {
      case 'conversation':
        return message.conversation || '';
      case 'imageMessage':
        return message.imageMessage?.caption || '';
      case 'videoMessage':
        return message.videoMessage?.caption || '';
      case 'audioMessage':
        return message.audioMessage?.caption || '';
      case 'documentMessage':
        return message.documentMessage?.caption || '';
      default:
        return '';
    }
  }
} 