import { Module } from '@nestjs/common';
import { MessagesModule } from '../../../messages/messages.module';
import { CustomerModule } from '../../../customer/customer.module';
import { QueueModule } from '../../../customer-queue/queue.module';
import { OtimaWebhookController } from './otima-webhook.controller';
import { OtimaWebhookService } from './otima-webhook.service';
import { AtosBotModule } from '../../../atos-bot/atos-bot.module';

@Module({
  imports: [MessagesModule, CustomerModule, QueueModule, AtosBotModule],
  controllers: [OtimaWebhookController],
  providers: [OtimaWebhookService],
  exports: [OtimaWebhookService],
})
export class OtimaWebhookModule {}


