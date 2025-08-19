import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { EvolutionModule } from '../evolution/evolution.module';
import { MessagesModule } from '../messages/messages.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [ConfigModule, MessagesModule, forwardRef(() => QueuesModule), EvolutionModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {} 