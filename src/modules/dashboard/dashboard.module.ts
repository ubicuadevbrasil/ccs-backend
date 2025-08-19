import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { QueuesModule } from '../queues/queues.module';
import { SocketModule } from '../socket/socket.module';
import { TabulationsModule } from '../tabulations/tabulations.module';
import { UsersModule } from '../users/users.module';
import { MailingModule } from '../mailing/mailing.module';

@Module({
  imports: [
    QueuesModule,
    SocketModule,
    TabulationsModule,
    UsersModule,
    MailingModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
