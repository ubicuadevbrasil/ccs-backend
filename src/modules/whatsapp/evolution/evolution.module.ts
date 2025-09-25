import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EvolutionService } from './evolution.service';
import { EvolutionRabbitMQModule } from './rabbitmq/rabbitmq.module';
import { EvolutionMessageProcessorService } from './rabbitmq/evolution-message-processor.service';
import { CustomerModule } from '../../customer/customer.module';
import { QueueModule } from '../../customer-queue/queue.module';
import { MessagesModule } from '../../messages/messages.module';

@Module({
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
  ],
  exports: [EvolutionService],
})
export class EvolutionModule {} 