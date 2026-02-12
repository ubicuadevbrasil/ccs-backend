import { Module } from '@nestjs/common';
import { OtimaApiModule } from './otima-api.module';
import { OtimaController } from './otima.controller';
import { OtimaWebhookModule } from './webhook/otima-webhook.module';

/**
 * Otima WhatsApp Business API Module
 * Provides integration with Otima broker WhatsApp APIs
 */
@Module({
  imports: [OtimaApiModule, OtimaWebhookModule],
  controllers: [OtimaController],
  exports: [OtimaApiModule],
})
export class OtimaModule {}


