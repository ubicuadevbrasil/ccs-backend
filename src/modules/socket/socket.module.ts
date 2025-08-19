import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { SocketController } from './socket.controller';
import { MessagesModule } from '../messages/messages.module';
import { QueuesModule } from '../queues/queues.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [MessagesModule, forwardRef(() => QueuesModule), AuthModule, forwardRef(() => ChatModule)],
  providers: [SocketGateway, SocketService],
  controllers: [SocketController],
  exports: [SocketService],
})
export class SocketModule {} 