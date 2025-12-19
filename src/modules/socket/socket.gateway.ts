import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

/**
 * Socket Gateway for handling real-time communication
 * 
 * This gateway manages WebSocket connections, user authentication,
 * and provides methods for broadcasting events and sending messages to specific users.
 */
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/socket',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId mapping
  private readonly connectionTimestamps = new Map<string, Date>(); // userId -> connectionTime mapping

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  /**
   * Handle new client connections
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractTokenFromSocket(client);
      
      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      const payload = await this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Client ${client.id} provided invalid token`);
        client.disconnect();
        return;
      }

      // Store user connection
      this.connectedUsers.set(payload.sub, client.id);
      this.connectionTimestamps.set(payload.sub, new Date());
      client.data.userId = payload.sub;
      client.data.userProfile = payload.profile;

      this.logger.log(`User ${payload.sub} connected with socket ${client.id}`);
      
      // Join user to their personal room
      await client.join(`user:${payload.sub}`);
      
      // Emit connection success
      client.emit('connected', {
        message: 'Successfully connected to socket server',
        userId: payload.sub,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Error handling connection for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnections
   */
  async handleDisconnect(client: Socket): Promise<void> {
    const userId = client.data.userId;
    
    if (userId) {
      this.connectedUsers.delete(userId);
      this.connectionTimestamps.delete(userId);
      this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
      // Update last activity timestamp
      try {
        await this.userService.updateLastActivityAt(userId);
      } catch (error) {
        this.logger.error(`Failed to update lastActivityAt for user ${userId}:`, error);
      }
    } else {
      this.logger.log(`Unknown client ${client.id} disconnected`);
    }
  }

  /**
   * Handle ping messages from clients
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  /**
   * Broadcast an event to all connected users
   */
  broadcastEvent(event: string, data: any): void {
    this.server.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Broadcasted event '${event}' to all connected users`);
  }

  /**
   * Send an event to a specific user by their userId
   */
  sendToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.connectedUsers.get(userId);
    
    if (!socketId) {
      this.logger.warn(`User ${userId} is not connected`);
      return false;
    }

    this.server.to(socketId).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Sent event '${event}' to user ${userId}`);
    return true;
  }

  /**
   * Send an event to multiple users
   */
  sendToUsers(userIds: string[], event: string, data: any): string[] {
    const sentTo: string[] = [];
    
    userIds.forEach(userId => {
      if (this.sendToUser(userId, event, data)) {
        sentTo.push(userId);
      }
    });

    this.logger.log(`Sent event '${event}' to ${sentTo.length}/${userIds.length} users`);
    return sentTo;
  }

  /**
   * Send an event to users with specific profile
   */
  sendToUsersByProfile(profile: string, event: string, data: any): void {
    this.server.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
      targetProfile: profile,
    });
    
    this.logger.log(`Sent event '${event}' to users with profile '${profile}'`);
  }

  /**
   * Get list of connected user IDs
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Check if a user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get the number of connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connection time for a specific user
   */
  getConnectionTime(userId: string): Date | null {
    return this.connectionTimestamps.get(userId) || null;
  }

  /**
   * Get all connected users with their connection timestamps
   */
  getAllConnectedUsersWithTimestamps(): Map<string, Date> {
    return new Map(this.connectionTimestamps);
  }

  /**
   * Get socket ID for a specific user
   */
  getSocketId(userId: string): string | null {
    return this.connectedUsers.get(userId) || null;
  }

  /**
   * Extract JWT token from socket handshake
   */
  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    const token = client.handshake.auth?.token;
    if (token) {
      return token;
    }

    return null;
  }

  /**
   * Verify JWT token and extract payload
   */
  private async verifyToken(token: string): Promise<any> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      return await this.jwtService.verifyAsync(token, { secret });
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      return null;
    }
  }
}
