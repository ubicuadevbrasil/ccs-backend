import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VonageWebhookController } from './vonage-webhook.controller';
import { VonageWebhookService } from './vonage-webhook.service';
import { CustomerModule } from '../../../customer/customer.module';
import { QueueModule } from '../../../customer-queue/queue.module';
import { MessagesModule } from '../../../messages/messages.module';
import { AtosBotModule } from '../../../atos-bot/atos-bot.module';

/**
 * Vonage Webhook Module
 * Handles webhook processing for Vonage WhatsApp Business API
 */
@Module({
  imports: [
    ConfigModule,
    CustomerModule,
    QueueModule,
    MessagesModule,
    forwardRef(() => AtosBotModule),
  ],
  controllers: [VonageWebhookController],
  providers: [VonageWebhookService],
  exports: [VonageWebhookService],
})
export class VonageWebhookModule {}
