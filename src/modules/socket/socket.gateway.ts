import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { SocketService } from './socket.service';
import { Department } from '../queues/interfaces/queue.interface';
import { SocketEvent, OperatorStatusUpdate } from './interfaces/socket.interface';
import { AuthService } from '../auth/auth.service';
import { UserDepartment } from '../users/interfaces/user.interface';
import { ChatService } from '../chat/chat.service';

interface OperatorAuth {
  operatorId: string;
  operatorName: string;
  department: Department;
  token: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://10.20.20.103:8083', 'http://10.85.170.15:8099', 'https://vm103-8083.ubicuacloud.com.br', 'https://ccs.unidasgestaodeterceiros.com.br'],
    credentials: true,
  },
  namespace: '/socket',
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly socketService: SocketService,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Socket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client attempting to connect: ${client.id}`);
    
    try {
      // Extract token from headers
      const token = client.handshake.headers.token as string;
      
      if (!token) {
        this.logger.warn(`No token provided from client: ${client.id}`);
        client.emit('error', { message: 'No authentication token provided' });
        client.disconnect();
        return;
      }

      // Validate token and get user info
      const tokenValidation = await this.authService.validateToken(token);
      
      if (!tokenValidation.valid || !tokenValidation.user) {
        this.logger.warn(`Invalid token from client: ${client.id}`);
        client.emit('error', { message: 'Invalid authentication token' });
        client.disconnect();
        return;
      }

      const user = tokenValidation.user;

      // Validate department and convert UserDepartment to Department
      const departmentMap: Record<UserDepartment, Department> = {
        [UserDepartment.PERSONAL]: Department.PERSONAL,
        [UserDepartment.FISCAL]: Department.FISCAL,
        [UserDepartment.ACCOUNTING]: Department.ACCOUNTING,
        [UserDepartment.FINANCIAL]: Department.FINANCIAL,
      };

      if (!user.department || !departmentMap[user.department]) {
        this.logger.warn(`Invalid department from client: ${client.id}, department: ${user.department}`);
        client.emit('error', { message: 'Invalid department' });
        client.disconnect();
        return;
      }

      const department = departmentMap[user.department];

      // Register operator connection
      this.socketService.registerOperatorConnection(
        client.id,
        user.id,
        user.name,
        department,
        client,
      );

      // Send connection confirmation
      client.emit('connected', {
        operatorId: user.id,
        operatorName: user.name,
        department: department,
        timestamp: new Date(),
      });

      this.logger.log(`Operator ${user.name} (${user.id}) connected successfully`);

    } catch (error) {
      this.logger.error(`Error during connection: ${error.message}`);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.socketService.removeOperatorConnection(client.id);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date() });
  }

  @SubscribeMessage('update_status')
  handleUpdateStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { currentQueueId?: string },
  ) {
    try {
      const socketConnection = this.socketService['socketConnections'].get(client.id);
      if (!socketConnection?.operatorId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      this.socketService.updateOperatorStatus(
        socketConnection.operatorId,
        data.currentQueueId,
      );

      client.emit('status_updated', {
        isAvailable: true, // Always true since operators can handle multiple queues
        currentQueueId: data.currentQueueId,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Error updating operator status: ${error.message}`);
      client.emit('error', { message: 'Failed to update status' });
    }
  }

  @SubscribeMessage('join_queue')
  handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { queueId: string },
  ) {
    try {
      const socketConnection = this.socketService['socketConnections'].get(client.id);
      if (!socketConnection?.operatorId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Join queue-specific room
      client.join(`queue:${data.queueId}`);
      
      client.emit('queue_joined', {
        queueId: data.queueId,
        timestamp: new Date(),
      });

      this.logger.log(`Operator ${socketConnection.operatorId} joined queue: ${data.queueId}`);

    } catch (error) {
      this.logger.error(`Error joining queue: ${error.message}`);
      client.emit('error', { message: 'Failed to join queue' });
    }
  }

  @SubscribeMessage('leave_queue')
  handleLeaveQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { queueId: string },
  ) {
    try {
      const socketConnection = this.socketService['socketConnections'].get(client.id);
      if (!socketConnection?.operatorId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Leave queue-specific room
      client.leave(`queue:${data.queueId}`);
      
      client.emit('queue_left', {
        queueId: data.queueId,
        timestamp: new Date(),
      });

      this.logger.log(`Operator ${socketConnection.operatorId} left queue: ${data.queueId}`);

    } catch (error) {
      this.logger.error(`Error leaving queue: ${error.message}`);
      client.emit('error', { message: 'Failed to leave queue' });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      instance: string;
      number: string;
      content: string; 
      messageType?: 'text' | 'media' | 'audio' | 'location' | 'contact' | 'sticker' | 'template';
      mediaUrl?: string;
      mediaType?: 'image' | 'video' | 'document';
      caption?: string;
      fileName?: string;
      mimetype?: string;
    },
  ) {
    try {
      const socketConnection = this.socketService['socketConnections'].get(client.id);
      if (!socketConnection?.operatorId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      let result;
      
      switch (data.messageType) {
        case 'text':
          result = await this.chatService.sendText({
            instance: data.instance,
            number: data.number,
            text: data.content,
          });
          break;
          
        case 'media':
          if (!data.mediaUrl || !data.mediaType || !data.fileName || !data.mimetype) {
            throw new Error('Media message requires mediaUrl, mediaType, fileName, and mimetype');
          }
          result = await this.chatService.sendMedia({
            instance: data.instance,
            number: data.number,
            mediatype: data.mediaType,
            media: data.mediaUrl,
            fileName: data.fileName,
            mimetype: data.mimetype,
            caption: data.caption,
          });
          break;
          
        case 'audio':
          if (!data.mediaUrl) {
            throw new Error('Audio message requires mediaUrl');
          }
          result = await this.chatService.sendAudio({
            instance: data.instance,
            number: data.number,
            audio: data.mediaUrl,
          });
          break;
          
        case 'location':
          // For location, content should be JSON with lat, lng, name, address
          const locationData = JSON.parse(data.content);
          result = await this.chatService.sendLocation({
            instance: data.instance,
            number: data.number,
            name: locationData.name,
            address: locationData.address,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          });
          break;
          
        case 'contact':
          // For contact, content should be JSON with contact info
          const contactData = JSON.parse(data.content);
          result = await this.chatService.sendContact({
            instance: data.instance,
            number: data.number,
            contact: contactData.contacts,
          });
          break;
          
        case 'sticker':
          if (!data.mediaUrl) {
            throw new Error('Sticker message requires mediaUrl');
          }
          result = await this.chatService.sendSticker({
            instance: data.instance,
            number: data.number,
            sticker: data.mediaUrl,
          });
          break;
          
        case 'template':
          // For template, content should be JSON with template info
          const templateData = JSON.parse(data.content);
          result = await this.chatService.sendTemplate({
            instance: data.instance,
            number: data.number,
            name: templateData.name,
            language: templateData.language,
            components: templateData.components,
          });
          break;
          
        default:
          // Default to text message
          result = await this.chatService.sendText({
            instance: data.instance,
            number: data.number,
            text: data.content,
          });
      }

      // Create message record in database
      try {
        // Find queue for this customer
        const customerPhone = data.number.replace('@s.whatsapp.net', '');
        const queue = await this.socketService['queuesService'].findQueueByCustomerPhone(customerPhone);
        
        if (queue) {
          // TODO: Create message record when MessagesService is properly injected
          this.logger.log(`Message sent by operator ${socketConnection.operatorId} to ${data.number}`);
        }
      } catch (error) {
        this.logger.error(`Error creating message record: ${error.message}`);
        // Don't fail the entire operation if message record creation fails
      }

      client.emit('message_sent', {
        instance: data.instance,
        number: data.number,
        content: data.content,
        messageType: data.messageType,
        result,
        timestamp: new Date(),
      });

      this.logger.log(`Operator ${socketConnection.operatorId} sent ${data.messageType || 'text'} message to ${data.number} via instance ${data.instance}`);

    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('error', { message: 'Failed to send message', error: error.message });
    }
  }

  @SubscribeMessage('get_connected_operators')
  handleGetConnectedOperators(@ConnectedSocket() client: Socket) {
    try {
      const operators = this.socketService.getConnectedOperators();
      client.emit('connected_operators', {
        operators,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Error getting connected operators: ${error.message}`);
      client.emit('error', { message: 'Failed to get connected operators' });
    }
  }

  @SubscribeMessage('get_available_operators')
  handleGetAvailableOperators(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { department?: Department },
  ) {
    try {
      let operators;
      if (data.department) {
        operators = this.socketService.getAvailableOperatorsByDepartment(data.department);
      } else {
        operators = this.socketService.getConnectedOperators();
      }

      client.emit('available_operators', {
        operators,
        department: data.department,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Error getting available operators: ${error.message}`);
      client.emit('error', { message: 'Failed to get available operators' });
    }
  }

  @SubscribeMessage('mark_messages_read')
  async handleMarkMessagesRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      instance: string;
      readMessages: Array<{
        remoteJid: string;
        fromMe: boolean;
        id: string;
      }>;
    },
  ) {
    try {
      const socketConnection = this.socketService['socketConnections'].get(client.id);
      if (!socketConnection?.operatorId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const result = await this.chatService.markMessagesAsRead({
        instance: data.instance,
        readMessages: data.readMessages,
      });

      client.emit('messages_marked_read', {
        instance: data.instance,
        readMessages: data.readMessages,
        result,
        timestamp: new Date(),
      });

      this.logger.log(`Operator ${socketConnection.operatorId} marked messages as read via instance ${data.instance}`);

    } catch (error) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
      client.emit('error', { message: 'Failed to mark messages as read', error: error.message });
    }
  }

  @SubscribeMessage('archive_chat')
  async handleArchiveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      instance: string;
      chat: string;
      archive: boolean;
      lastMessage: {
        key: {
          remoteJid: string;
          fromMe: boolean;
          id: string;
        };
      };
    },
  ) {
    try {
      const socketConnection = this.socketService['socketConnections'].get(client.id);
      if (!socketConnection?.operatorId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const result = await this.chatService.archiveChat({
        instance: data.instance,
        chat: data.chat,
        archive: data.archive,
        lastMessage: data.lastMessage,
      });

      client.emit('chat_archived', {
        instance: data.instance,
        chat: data.chat,
        archive: data.archive,
        result,
        timestamp: new Date(),
      });

      this.logger.log(`Operator ${socketConnection.operatorId} ${data.archive ? 'archived' : 'unarchived'} chat ${data.chat} via instance ${data.instance}`);

    } catch (error) {
      this.logger.error(`Error archiving chat: ${error.message}`);
      client.emit('error', { message: 'Failed to archive chat', error: error.message });
    }
  }

  @SubscribeMessage('find_chats')
  async handleFindChats(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { instance: string },
  ) {
    try {
      const socketConnection = this.socketService['socketConnections'].get(client.id);
      if (!socketConnection?.operatorId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const result = await this.chatService.findChats({
        instance: data.instance,
      });

      client.emit('chats_found', {
        instance: data.instance,
        chats: result,
        timestamp: new Date(),
      });

      this.logger.log(`Operator ${socketConnection.operatorId} found chats via instance ${data.instance}`);

    } catch (error) {
      this.logger.error(`Error finding chats: ${error.message}`);
      client.emit('error', { message: 'Failed to find chats', error: error.message });
    }
  }

  @SubscribeMessage('find_messages')
  async handleFindMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      instance: string;
      where?: {
        key?: {
          remoteJid?: string;
        };
      };
      page?: number;
      offset?: number;
    },
  ) {
    try {
      const socketConnection = this.socketService['socketConnections'].get(client.id);
      if (!socketConnection?.operatorId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const result = await this.chatService.findMessages({
        instance: data.instance,
        where: data.where,
        page: data.page,
        offset: data.offset,
      });

      client.emit('messages_found', {
        instance: data.instance,
        messages: result,
        timestamp: new Date(),
      });

      this.logger.log(`Operator ${socketConnection.operatorId} found messages via instance ${data.instance}`);

    } catch (error) {
      this.logger.error(`Error finding messages: ${error.message}`);
      client.emit('error', { message: 'Failed to find messages', error: error.message });
    }
  }

  // Method to handle webhook events from the webhook service
  async handleWebhookEvent(webhookData: any): Promise<void> {
    await this.socketService.handleWebhookEvent(webhookData);
  }

  // Method to broadcast system notifications
  broadcastSystemNotification(notification: any): void {
    this.server.emit('system_notification', notification);
  }

  // Method to broadcast to specific room
  broadcastToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event, data);
  }

  // Method to broadcast to all connected clients
  broadcastToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }
} 