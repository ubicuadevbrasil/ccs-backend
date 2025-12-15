import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtimaService } from './otima.service';
import { OtimaController } from './otima.controller';
import { OtimaWebhookModule } from './webhook/otima-webhook.module';

/**
 * Otima WhatsApp Business API Module
 * Provides integration with Otima broker WhatsApp APIs
 */
@Module({
  imports: [ConfigModule, OtimaWebhookModule],
  controllers: [OtimaController],
  providers: [OtimaService],
  exports: [OtimaService],
})
export class OtimaModule {}


