import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MessagesModule } from '../messages/messages.module';
import { EvolutionModule } from '../whatsapp/evolution/evolution.module';
import { OtimaModule } from '../whatsapp/otima/otima.module';
import { QueueModule } from '../customer-queue/queue.module';
import { ChatOtimaService } from './services/chat.otima.service';
import { PlatformChatServiceFactory } from './services/platform-chat.service.factory';
import { EvolutionMessageMapperService } from '../whatsapp/evolution/evolution-mapper';
import { OtimaMessageMapperService } from '../whatsapp/otima/otima-mapper';

@Module({})
export class ChatModule {
  static forRoot(): DynamicModule {
    return {
      module: ChatModule,
      imports: [
        ConfigModule,
        MessagesModule,
        OtimaModule,
        QueueModule,
      ],
      controllers: [ChatController],
      providers: [
        ChatService,
        ChatOtimaService,
        PlatformChatServiceFactory,
      ],
      exports: [ChatService, PlatformChatServiceFactory],
    };
  }

  static forRootAsync(): DynamicModule {
    return {
      module: ChatModule,
      imports: [
        ConfigModule,
        MessagesModule,
        OtimaModule,
        QueueModule,
      ],
      controllers: [ChatController],
      providers: [
        ChatService,
        ChatOtimaService,
        PlatformChatServiceFactory,
        {
          provide: 'EVOLUTION_MAPPER',
          useFactory: (configService: ConfigService) => {
            const isEnabled = configService.get<boolean>('EVOLUTION_WHATSAPP', false);
            return isEnabled ? new EvolutionMessageMapperService() : null;
          },
          inject: [ConfigService],
        },
        {
          provide: 'OTIMA_MAPPER',
          useFactory: (configService: ConfigService) => {
            const isEnabled = configService.get<boolean>('OTIMA_WHATSAPP', false);
            return isEnabled ? new OtimaMessageMapperService() : null;
          },
          inject: [ConfigService],
        },
      ],
      exports: [ChatService, PlatformChatServiceFactory],
    };
  }
}
