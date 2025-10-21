import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EvolutionService } from './evolution.service';
import { EvolutionRabbitMQModule } from './rabbitmq/rabbitmq.module';
import { EvolutionMessageProcessorService } from './rabbitmq/evolution-message-processor.service';
import { EvolutionMessageMapperService } from './evolution-mapper';
import { CustomerModule } from '../../customer/customer.module';
import { QueueModule } from '../../customer-queue/queue.module';
import { MessagesModule } from '../../messages/messages.module';

/**
 * Evolution Module with Feature Flag Support
 * 
 * This module can be conditionally loaded based on the EVOLUTION_WHATSAPP environment variable.
 * 
 * Usage:
 * - Set EVOLUTION_WHATSAPP=true in your .env file to enable Evolution API
 * - Set EVOLUTION_WHATSAPP=false (or omit) to disable Evolution API
 * 
 * When disabled, Evolution services will not be instantiated and will not require
 * EVOLUTION_API_BASE_URL or EVOLUTION_API_KEY environment variables.
 */
@Module({})
export class EvolutionModule {
  static forRoot(): DynamicModule {
    return {
      module: EvolutionModule,
      imports: [
        ConfigModule,
        CustomerModule,
        QueueModule,
        MessagesModule,
        EvolutionRabbitMQModule,
      ],
      providers: [
        EvolutionService,
        EvolutionMessageProcessorService,
        EvolutionMessageMapperService,
      ],
      exports: [EvolutionService, EvolutionMessageMapperService],
    };
  }

  static forRootAsync(): DynamicModule {
    return {
      module: EvolutionModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'EVOLUTION_CONFIG',
          useFactory: (configService: ConfigService) => ({
            enabled: configService.get<boolean>('EVOLUTION_WHATSAPP', false),
            baseUrl: configService.get<string>('EVOLUTION_API_BASE_URL'),
            apiKey: configService.get<string>('EVOLUTION_API_KEY'),
          }),
          inject: [ConfigService],
        },
      ],
      exports: ['EVOLUTION_CONFIG'],
    };
  }
} 