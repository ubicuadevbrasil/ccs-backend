import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'evolution.events',
            type: 'topic',
          },
          {
            name: 'whatsapp.commands',
            type: 'direct',
          },
        ],
        uri: configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672',
        connectionInitOptions: { wait: false },
        enableControllerDiscovery: true,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [RabbitMQModule],
})
export class EvolutionRabbitMQModule {}
