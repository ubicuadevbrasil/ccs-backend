import { Injectable, Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

/**
 * Socket Service for managing real-time events
 * 
 * This service provides a clean interface for other modules to send
 * real-time events to connected clients without directly accessing the gateway.
 */
@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);

  constructor(private readonly socketGateway: SocketGateway) {}

  /**
   * Broadcast a new message event to all connected users
   */
  broadcastNewMessage(messageData: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    chatId: string;
    platform: string;
    timestamp: string;
    messageType?: 'text' | 'image' | 'file' | 'audio' | 'video';
  }): void {
    this.socketGateway.broadcastEvent('new_message', {
      type: 'message',
      data: messageData,
    });
  }

  /**
   * Broadcast message status update to all connected users
   */
  broadcastMessageStatusUpdate(statusData: {
    messageId: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    chatId: string;
  }): void {
    this.socketGateway.broadcastEvent('message_status_update', {
      type: 'status_update',
      data: statusData,
    });
  }

  /**
   * Send notification to a specific user
   */
  sendNotificationToUser(userId: string, notification: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    data?: any;
  }): boolean {
    return this.socketGateway.sendToUser(userId, 'notification', {
      type: 'notification',
      data: notification,
    });
  }

  /**
   * Send chat update to specific user
   */
  sendChatUpdateToUser(userId: string, chatData: {
    chatId: string;
    action: 'created' | 'updated' | 'deleted' | 'user_joined' | 'user_left';
    data: any;
  }): boolean {
    return this.socketGateway.sendToUser(userId, 'chat_update', {
      type: 'chat_update',
      data: chatData,
    });
  }

  /**
   * Send customer queue update to supervisors and operators
   */
  sendQueueUpdate(queueData: {
    queueId: string;
    action: 'customer_joined' | 'customer_left' | 'customer_served' | 'queue_updated';
    customerId: string;
    customerName: string;
    estimatedWaitTime?: number;
    position?: number;
  }): void {
    // Send to supervisors and operators
    this.socketGateway.sendToUsersByProfile('supervisor', 'queue_update', {
      type: 'queue_update',
      data: queueData,
    });
    
    this.socketGateway.sendToUsersByProfile('operator', 'queue_update', {
      type: 'queue_update',
      data: queueData,
    });
  }

  /**
   * Send system alert to administrators
   */
  sendSystemAlert(alertData: {
    id: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    component?: string;
    data?: any;
  }): void {
    this.socketGateway.sendToUsersByProfile('admin', 'system_alert', {
      type: 'system_alert',
      data: alertData,
    });
  }

  /**
   * Send user status update (online/offline)
   */
  sendUserStatusUpdate(userId: string, status: 'online' | 'offline' | 'away' | 'busy'): boolean {
    return this.socketGateway.sendToUser(userId, 'user_status_update', {
      type: 'user_status',
      data: {
        userId,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Broadcast user status change to all connected users
   */
  broadcastUserStatusChange(userId: string, status: 'online' | 'offline' | 'away' | 'busy'): void {
    this.socketGateway.broadcastEvent('user_status_change', {
      type: 'user_status',
      data: {
        userId,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Send typing indicator to specific user
   */
  sendTypingIndicator(userId: string, typingData: {
    chatId: string;
    userId: string;
    userName: string;
    isTyping: boolean;
  }): boolean {
    return this.socketGateway.sendToUser(userId, 'typing_indicator', {
      type: 'typing',
      data: typingData,
    });
  }

  /**
   * Send custom event to specific user
   */
  sendCustomEventToUser(userId: string, event: string, data: any): boolean {
    return this.socketGateway.sendToUser(userId, event, data);
  }

  /**
   * Send custom event to multiple users
   */
  sendCustomEventToUsers(userIds: string[], event: string, data: any): string[] {
    return this.socketGateway.sendToUsers(userIds, event, data);
  }

  /**
   * Broadcast custom event to all connected users
   */
  broadcastCustomEvent(event: string, data: any): void {
    this.socketGateway.broadcastEvent(event, data);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.socketGateway.getConnectedUsersCount();
  }

  /**
   * Get list of connected user IDs
   */
  getConnectedUsers(): string[] {
    return this.socketGateway.getConnectedUsers();
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.socketGateway.isUserConnected(userId);
  }
}
