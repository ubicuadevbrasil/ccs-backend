import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { HistoryModule } from '../history/history.module';
import { UserModule } from '../user/user.module';
import { RedisModule } from '../../shared/redis.module';

@Module({
  imports: [
    HistoryModule,
    UserModule,
    RedisModule,
  ],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
