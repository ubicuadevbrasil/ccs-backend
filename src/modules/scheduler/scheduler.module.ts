import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { EvolutionModule } from '../evolution/evolution.module';
import { QueuesModule } from '../queues/queues.module';
import { MessagesModule } from '../messages/messages.module';
import { TypebotModule } from '../typebot/typebot.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EvolutionModule,
    QueuesModule,
    MessagesModule,
    forwardRef(() => TypebotModule),
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
