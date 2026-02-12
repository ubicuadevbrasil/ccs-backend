import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtimaService } from './otima.service';

/**
 * Otima API Module - provides OtimaService for sending messages.
 * Extracted to avoid circular dependencies with OtimaWebhookModule.
 */
@Module({
  imports: [ConfigModule],
  providers: [OtimaService],
  exports: [OtimaService],
})
export class OtimaApiModule {}
