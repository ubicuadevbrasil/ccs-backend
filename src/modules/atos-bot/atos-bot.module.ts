import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { MessagesModule } from '../messages/messages.module';
import { VonageModule } from '../whatsapp/vonage/vonage.module';
import { QueueModule } from '../customer-queue/queue.module';
import { CustomerModule } from '../customer/customer.module';
import { AtosBotService } from './atos-bot.service';
import { AtosBotApiService } from './atos-bot-api.service';
import { AtosBotApiController } from './atos-bot-api.controller';

/**
 * Atos Bot Module
 * Handles intent detection and bot logic for WhatsApp conversations
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MessagesModule,
    forwardRef(() => VonageModule),
    QueueModule,
    CustomerModule,
  ],
  controllers: [AtosBotApiController],
  providers: [AtosBotService, AtosBotApiService],
  exports: [AtosBotService],
})
export class AtosBotModule {}


