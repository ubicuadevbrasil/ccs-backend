import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    ConfigModule,
    HistoryModule,
  ],
  controllers: [QueueController],
  providers: [
    QueueService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService): Promise<Redis> => {
        const redisUrl = configService.get<string>('REDIS_URL');
        
        if (redisUrl) {
          return new Redis(redisUrl);
        }

        return new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [QueueService],
})
export class QueueModule {}
