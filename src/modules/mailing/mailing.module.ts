import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailingService } from './mailing.service';
import { MailingController } from './mailing.controller';
import { MailingQueueService } from './mailing-queue.service';
import { MailingQueueProcessor } from './mailing-queue.processor';
import { MailingQueueManagerService } from './mailing-queue-manager.service';
import { CustomerModule } from '../customer/customer.module';
import { EvolutionModule } from '../evolution/evolution.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mailing',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    CustomerModule,
    EvolutionModule,
  ],
  controllers: [MailingController],
  providers: [
    MailingService,
    MailingQueueService,
    MailingQueueProcessor,
    MailingQueueManagerService,
  ],
  exports: [
    MailingService,
    MailingQueueService,
    MailingQueueManagerService,
  ],
})
export class MailingModule {}
