import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';
import { QueuesService } from '../queues/queues.service';
import {
  OperatorConnection,
  SocketMessage,
  QueueUpdate,
  WebhookEvent,
  SocketEvent,
  OperatorStatusUpdate,
  SystemNotification,
  SocketRoom,
  SocketConnection,
} from './interfaces/socket.interface';
import { MessageFrom, MessageDirection, MessageStatus } from '../messages/interfaces/message.interface';
import { QueueStatus, Department } from '../queues/interfaces/queue.interface';
import { AuthenticatedUser } from './dto/socket.dto';

@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);
  
  // Store active operator connections
  private operatorConnections = new Map<string, OperatorConnection>();
  
  // Store socket connections
  private socketConnections = new Map<string, SocketConnection>();
  
  // Store rooms
  private rooms = new Map<string, SocketRoom>();

  constructor(
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => QueuesService))
    private readonly queuesService: QueuesService,
  ) {}

  /**
   * Register a new operator connection
   */
  registerOperatorConnection(
    socketId: string,
    operatorId: string,
    operatorName: string,
    department: Department,
    socket: Socket,
  ): void {
    const connection: OperatorConnection = {
      socketId,
      operatorId,
      operatorName,
      department,
      isAvailable: true,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.operatorConnections.set(operatorId, connection);
    
    const socketConnection: SocketConnection = {
      socket,
      operatorId,
      department,
      rooms: [`operator:${operatorId}`, `department:${department}`],
      metadata: { operatorName },
    };
    
    this.socketConnections.set(socketId, socketConnection);
    
    // Join operator and department rooms
    socket.join(`operator:${operatorId}`);
    socket.join(`department:${department}`);
    socket.join('system');
    
    this.logger.log(`Operator ${operatorName} (${operatorId}) connected`);
    
    // Broadcast operator status update
    this.broadcastOperatorStatusUpdate({
      operatorId,
      isAvailable: true,
      department,
    });
  }

  /**
   * Remove operator connection
   */
  removeOperatorConnection(socketId: string): void {
    const socketConnection = this.socketConnections.get(socketId);
    if (!socketConnection?.operatorId) return;

    const operatorId = socketConnection.operatorId;
    const connection = this.operatorConnections.get(operatorId);
    
    if (connection) {
      this.operatorConnections.delete(operatorId);
      this.logger.log(`Operator ${connection.operatorName} (${operatorId}) disconnected`);
      
      // Broadcast operator status update
      this.broadcastOperatorStatusUpdate({
        operatorId,
        isAvailable: false,
        department: connection.department,
      });
    }
    
    this.socketConnections.delete(socketId);
  }

  /**
   * Handle webhook events and broadcast to relevant operators
   * Note: This method is called AFTER webhook processing is complete
   */
  async handleWebhookEvent(webhookData: any): Promise<void> {
    try {
      this.logger.log(`Broadcasting webhook event: ${webhookData?.event} for instance ${webhookData?.instance}`);
      
      // Create webhook event for socket broadcast
      const webhookEvent: WebhookEvent = {
        event: webhookData.event,
        instance: webhookData.instance,
        data: webhookData.data,
        timestamp: new Date(),
      };

      // Broadcast webhook event to all operators
      this.broadcastWebhookEvent(webhookEvent);

      // Handle specific event types
      await this.handleSpecificWebhookEvent(webhookData);
      
    } catch (error) {
      this.logger.error('Error handling webhook event:', error);
    }
  }

  /**
   * Handle specific webhook events and route to appropriate operators
   */
  private async handleSpecificWebhookEvent(webhookData: any): Promise<void> {
    const { event, data, instance } = webhookData;

    switch (event) {
      case 'messages.upsert':
        await this.handleNewMessage(data, instance);
        break;
        
      case 'messages.update':
        await this.handleMessageUpdate(data, instance);
        break;
        
      case 'connection.update':
        await this.handleConnectionUpdate(data, instance);
        break;
        
      default:
        this.logger.log(`No specific handler for event: ${event}`);
    }
  }

  /**
   * Handle new message events
   */
  private async handleNewMessage(data: any, instance: string): Promise<void> {
    try {
      if (!data?.key?.remoteJid) return;

      const customerPhone = data.key.remoteJid;
      
      // Find queue for this customer
      const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);
      
      if (!queue) {
        this.logger.log(`No queue found for customer: ${customerPhone}`);
        return;
      }

      // Create socket message
      const socketMessage: SocketMessage = {
        id: data.key.id,
        sessionId: queue.sessionId,
        content: this.extractMessageContent(data.message),
        from: MessageFrom.CUSTOMER,
        direction: MessageDirection.INBOUND,
        status: MessageStatus.DELIVERED,
        senderId: customerPhone,
        senderPhone: customerPhone,
        messageType: this.getMessageType(data.message),
        mediaUrl: data.mediaUrl,
        timestamp: new Date(data.messageTimestamp * 1000),
        evolutionData: data,
      };

      // Broadcast to assigned operator if exists
      if (queue.assignedOperatorId) {
        this.broadcastToOperator(queue.assignedOperatorId, {
          type: 'message',
          data: socketMessage,
          target: queue.assignedOperatorId,
        });
      } else {
        // Broadcast to department operators
        this.broadcastToDepartment(queue.department, {
          type: 'message',
          data: socketMessage,
          target: 'all',
        });
      }

      // Update queue status if needed
      if (queue.status === QueueStatus.WAITING) {
        // Get customer data for the queue
        const queueWithCustomer = await this.queuesService.findQueueWithCustomer(queue.id);
        
        if (queueWithCustomer) {
          const queueUpdate: QueueUpdate = {
            id: queue.id,
            sessionId: queue.sessionId,
            customerPhone: queueWithCustomer.customer.remoteJid,
            customerName: queueWithCustomer.customer.pushName,
            status: queue.status,
            department: queue.department,
            assignedOperatorId: queue.assignedOperatorId,
            createdAt: queue.createdAt,
            assignedAt: queue.assignedAt,
          };

          this.broadcastQueueUpdate(queueUpdate);
        }
      }

    } catch (error) {
      this.logger.error('Error handling new message:', error);
    }
  }

  /**
   * Handle message updates (delivery status, read receipts, etc.)
   */
  private async handleMessageUpdate(data: any, instance: string): Promise<void> {
    try {
      if (!data?.key?.remoteJid) return;

      const customerPhone = data.key.remoteJid;
      const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);
      
      if (!queue?.assignedOperatorId) return;

      // Create status update message
      const statusUpdate: SocketMessage = {
        id: data.key.id,
        sessionId: queue.sessionId,
        content: `Message status updated: ${data.update.status || 'unknown'}`,
        from: MessageFrom.SYSTEM,
        direction: MessageDirection.OUTBOUND,
        status: this.mapMessageStatus(data.update.status),
        senderId: 'system',
        messageType: 'status_update',
        timestamp: new Date(),
        evolutionData: data,
      };

      this.broadcastToOperator(queue.assignedOperatorId, {
        type: 'message',
        data: statusUpdate,
        target: queue.assignedOperatorId,
      });

    } catch (error) {
      this.logger.error('Error handling message update:', error);
    }
  }

  /**
   * Handle connection updates
   */
  private async handleConnectionUpdate(data: any, instance: string): Promise<void> {
    try {
      const systemNotification: SystemNotification = {
        type: 'info',
        title: 'Connection Update',
        message: `WhatsApp connection status: ${data.state || 'unknown'}`,
        data: { instance, state: data.state },
      };

      this.broadcastSystemNotification(systemNotification);
      
    } catch (error) {
      this.logger.error('Error handling connection update:', error);
    }
  }

  /**
   * Broadcast message to specific operator
   */
  broadcastToOperator(operatorId: string, event: SocketEvent): void {
    const connection = this.operatorConnections.get(operatorId);
    if (!connection) {
      this.logger.warn(`Operator ${operatorId} not connected`);
      return;
    }

    const socketConnection = this.socketConnections.get(connection.socketId);
    if (socketConnection) {
      console.log('broadcastToOperator', event.data.event);
      socketConnection.socket.emit(event.data.event, event);
      connection.lastActivity = new Date();
    }
  }

  /**
   * Broadcast to all operators in a specific department
   */
  broadcastToDepartment(department: Department, event: SocketEvent): void {
    const departmentOperators = Array.from(this.operatorConnections.values())
      .filter(op => op.department === department);

    departmentOperators.forEach(operator => {
      this.broadcastToOperator(operator.operatorId, event);
    });
  }

  /**
   * Broadcast to all connected operators
   */
  broadcastToAll(event: SocketEvent): void {
    this.operatorConnections.forEach((connection, operatorId) => {
      this.broadcastToOperator(operatorId, event);
    });
  }

  /**
   * Broadcast webhook event
   */
  broadcastWebhookEvent(webhookEvent: WebhookEvent): void {
    this.broadcastToAll({
      type: 'webhook_event',
      data: webhookEvent,
      target: 'all',
    });
  }

  /**
   * Broadcast queue update
   */
  broadcastQueueUpdate(queueUpdate: QueueUpdate): void {
    this.broadcastToAll({
      type: 'queue_update',
      data: queueUpdate,
      target: 'all',
    });
  }

  /**
   * Broadcast operator status update
   */
  broadcastOperatorStatusUpdate(statusUpdate: OperatorStatusUpdate): void {
    this.broadcastToAll({
      type: 'operator_status',
      data: statusUpdate,
      target: 'all',
    });
  }

  /**
   * Broadcast system notification
   */
  broadcastSystemNotification(notification: SystemNotification): void {
    this.broadcastToAll({
      type: 'system_notification',
      data: notification,
      target: 'all',
    });
  }

  /**
   * Update operator current queue status
   */
  updateOperatorStatus(operatorId: string, currentQueueId?: string): void {
    const connection = this.operatorConnections.get(operatorId);
    if (!connection) return;

    connection.currentQueueId = currentQueueId;
    connection.lastActivity = new Date();

    this.broadcastOperatorStatusUpdate({
      operatorId,
      isAvailable: true, // Always true since operators can handle multiple queues
      currentQueueId,
      department: connection.department,
    });
  }

  /**
   * Get all connected operators
   */
  getConnectedOperators(): OperatorConnection[] {
    return Array.from(this.operatorConnections.values());
  }

  /**
   * Get available operators by department
   */
  getAvailableOperatorsByDepartment(department: Department): OperatorConnection[] {
    return Array.from(this.operatorConnections.values())
      .filter(op => op.department === department);
  }

  /**
   * Extract message content from evolution data
   */
  private extractMessageContent(message: any): string {
    if (!message) return '';
    
    // Handle different message types
    if (message.conversation) return message.conversation;
    if (message.imageMessage?.caption) return message.imageMessage.caption;
    if (message.videoMessage?.caption) return message.videoMessage.caption;
    if (message.audioMessage?.caption) return message.audioMessage.caption;
    if (message.documentMessage?.caption) return message.documentMessage.caption;
    
    return '[Media Message]';
  }

  /**
   * Get message type from evolution data
   */
  private getMessageType(message: any): string {
    if (!message) return 'unknown';
    
    if (message.conversation) return 'conversation';
    if (message.imageMessage) return 'imageMessage';
    if (message.videoMessage) return 'videoMessage';
    if (message.audioMessage) return 'audioMessage';
    if (message.documentMessage) return 'documentMessage';
    if (message.stickerMessage) return 'stickerMessage';
    if (message.contactMessage) return 'contactMessage';
    if (message.locationMessage) return 'locationMessage';
    if (message.reactionMessage) return 'reactionMessage';
    
    return 'unknown';
  }

  /**
   * Map evolution message status to internal status
   */
  private mapMessageStatus(evolutionStatus: string): MessageStatus {
    switch (evolutionStatus) {
      case 'SENT':
        return MessageStatus.SENT;
      case 'DELIVERED':
        return MessageStatus.DELIVERED;
      case 'READ':
        return MessageStatus.READ;
      case 'FAILED':
        return MessageStatus.FAILED;
      default:
        return MessageStatus.PENDING;
    }
  }

  /**
   * Send disconnect event to a specific user
   */
  sendDisconnectEvent(userId: string, user: AuthenticatedUser, reason?: string): boolean {
    const connection = this.operatorConnections.get(userId);
    if (!connection) {
      this.logger.warn(`User ${userId} not connected`);
      return false;
    }

    const socketConnection = this.socketConnections.get(connection.socketId);
    if (!socketConnection) {
      this.logger.warn(`Socket connection not found for user ${userId}`);
      return false;
    }

    try {
      // Send disconnect event to the user
      const disconnectEvent: SocketEvent = {
        type: 'disconnect',
        data: {
          operatorId: user.id,
          operatorName: user.name,
          reason: reason || `Disconnected by ${user.name}`,
          timestamp: new Date(),
          userId: userId
        },
        target: userId
      };

      socketConnection.socket.emit('supervisor.disconnect', disconnectEvent);
      connection.lastActivity = new Date();
      
      this.logger.log(`Disconnect event sent to user ${userId}${reason ? ` with reason: ${reason}` : ''}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send disconnect event to user ${userId}:`, error);
      return false;
    }
  }
} 