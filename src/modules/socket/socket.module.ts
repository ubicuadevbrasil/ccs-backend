import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { UserModule } from '../user/user.module';

/**
 * Socket Module
 * 
 * This module provides real-time communication capabilities using Socket.IO.
 * It includes authentication, event broadcasting, and user-specific messaging.
 * 
 * Features:
 * - JWT-based authentication for socket connections
 * - Broadcasting events to all connected users
 * - Sending events to specific users by userId
 * - User connection management
 * - Real-time message and status updates
 */
@Module({
  imports: [
    ConfigModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SocketGateway, SocketService],
  exports: [SocketService, SocketGateway],
})
export class SocketModule {}
