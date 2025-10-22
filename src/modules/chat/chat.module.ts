import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MessagesModule } from '../messages/messages.module';
import { VonageModule } from '../whatsapp/vonage/vonage.module';
import { EvolutionModule } from '../whatsapp/evolution/evolution.module';
import { QueueModule } from '../customer-queue/queue.module';
import { ChatVonageService } from './services/chat.vonage.service';
import { PlatformChatServiceFactory } from './services/platform-chat.service.factory';
import { EvolutionMessageMapperService } from '../whatsapp/evolution/evolution-mapper';
import { VonageMessageMapperService } from '../whatsapp/vonage/vonage-mapper';

@Module({})
export class ChatModule {
  static forRoot(): DynamicModule {
    return {
      module: ChatModule,
      imports: [
        ConfigModule,
        MessagesModule,
        VonageModule,
        QueueModule,
      ],
      controllers: [ChatController],
      providers: [
        ChatService,
        ChatVonageService,
        PlatformChatServiceFactory,
        VonageMessageMapperService,
      ],
      exports: [ChatService, ChatVonageService, PlatformChatServiceFactory],
    };
  }

  static forRootAsync(): DynamicModule {
    return {
      module: ChatModule,
      imports: [
        ConfigModule,
        MessagesModule,
        VonageModule,
        QueueModule,
      ],
      controllers: [ChatController],
      providers: [
        ChatService,
        ChatVonageService,
        PlatformChatServiceFactory,
        {
          provide: 'VONAGE_MAPPER',
          useFactory: (configService: ConfigService) => {
            const isEnabled = configService.get<boolean>('VONAGE_WHATSAPP', true);
            return isEnabled ? new VonageMessageMapperService() : null;
          },
          inject: [ConfigService],
        },
        {
          provide: 'EVOLUTION_MAPPER',
          useFactory: (configService: ConfigService) => {
            const isEnabled = configService.get<boolean>('EVOLUTION_WHATSAPP', false);
            return isEnabled ? new EvolutionMessageMapperService() : null;
          },
          inject: [ConfigService],
        },
      ],
      exports: [ChatService, ChatVonageService, PlatformChatServiceFactory],
    };
  }
}
