import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EvolutionService } from './evolution.service';
import { EvolutionRabbitMQModule } from './rabbitmq/rabbitmq.module';
import { EvolutionRabbitMQConsumer } from './rabbitmq/evolution-rabbitmq.consumer';
import { EvolutionMessageProcessorService } from './rabbitmq/evolution-message-processor.service';

@Module({
  imports: [
    ConfigModule,
    EvolutionRabbitMQModule,
  ],
  providers: [
    EvolutionService,
    EvolutionRabbitMQConsumer,
    EvolutionMessageProcessorService,
  ],
  exports: [EvolutionService],
})
export class EvolutionModule {} 