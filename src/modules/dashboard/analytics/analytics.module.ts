import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SocketModule } from '../../socket/socket.module';
import { QueueModule } from '../../customer-queue/queue.module';

@Module({
  imports: [
    SocketModule,
    QueueModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

