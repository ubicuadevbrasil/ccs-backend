import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VonageService } from './vonage.service';
import { VonageController } from './vonage.controller';
import { VonageWebhookModule } from './webhook/vonage-webhook.module';

/**
 * Vonage WhatsApp Business API Module
 * Provides integration with Vonage Communications APIs
 */
@Module({
  imports: [
    ConfigModule,
    VonageWebhookModule,
  ],
  controllers: [VonageController],
  providers: [VonageService],
  exports: [VonageService],
})
export class VonageModule {}
