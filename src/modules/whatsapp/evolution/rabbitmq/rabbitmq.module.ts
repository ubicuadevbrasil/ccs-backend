import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule, MessageHandlerErrorBehavior } from '@golevelup/nestjs-rabbitmq';
import { EvolutionRabbitMQConsumer } from './evolution-rabbitmq.consumer';
import { EvolutionMessageProcessorService } from './evolution-message-processor.service';
import { CustomerModule } from '../../../customer/customer.module';
import { QueueModule } from '../../../customer-queue/queue.module';
import { MessagesModule } from '../../../messages/messages.module';
import { EvolutionService } from '../evolution.service';

/**
 * Evolution RabbitMQ Module using @golevelup/nestjs-rabbitmq
 * This module configures RabbitMQ with much cleaner setup compared to manual configuration
 */
@Module({
  imports: [
    ConfigModule,
    CustomerModule,
    QueueModule,
    MessagesModule,
    // Configure RabbitMQ module with connection settings
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        // Connection configuration
        uri: configService.get<string>('RABBITMQ_URI', 'amqp://localhost:5672'),
        
        // Connection manager options (uses amqp-connection-manager under the hood)
        connectionInitOptions: {
          wait: false,
          timeout: 10000,
        },
        connectionManagerOptions: {
          reconnectTimeInSeconds: 5,
          heartbeatIntervalInSeconds: 30,
        },

        // Exchange configuration
        exchanges: [
          {
            name: 'evolution_exchange',
            type: 'topic',
            options: {
              durable: true,
            },
          },
        ],

        // Global message handling configuration
        defaultRpcTimeout: 30000,
        defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.REQUEUE,
        
        // Channel configuration
        channels: {
          'default': {
            prefetchCount: 10, // Process up to 10 messages at once
            default: true,
          },
          'high-priority': {
            prefetchCount: 5, // Lower prefetch for high-priority messages
          },
        },

        // Enable request/response pattern if needed
        enableDirectReplyTo: false,
        
        // Global error handling
        errorHandler: (channel, msg, error) => {
          console.error('RabbitMQ Error:', error);
          console.error('Message:', msg);
          // You can implement custom error handling logic here
          // For example: send to dead letter queue, log to external service, etc.
        },
      }),
    }),
  ],
  
  providers: [
    EvolutionRabbitMQConsumer,
    EvolutionMessageProcessorService,
    EvolutionService,
  ],
  
  exports: [
    EvolutionRabbitMQConsumer,
    RabbitMQModule,
  ],
})
export class EvolutionRabbitMQModule {}
