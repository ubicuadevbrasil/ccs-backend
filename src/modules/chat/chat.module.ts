import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MessagesModule } from '../messages/messages.module';
import { EvolutionModule } from '../whatsapp/evolution/evolution.module';
import { QueueModule } from '../customer-queue/queue.module';
import { ChatEvolutionService } from './services/chat.evolution.service';
import { PlatformChatServiceFactory } from './services/platform-chat.service.factory';

@Module({
  imports: [MessagesModule, EvolutionModule, QueueModule],
  controllers: [ChatController],
  providers: [ChatService, ChatEvolutionService, PlatformChatServiceFactory],
  exports: [ChatService, ChatEvolutionService, PlatformChatServiceFactory],
})
export class ChatModule {}
