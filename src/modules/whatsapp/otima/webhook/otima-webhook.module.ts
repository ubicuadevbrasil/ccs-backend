import { Module } from '@nestjs/common';
import { MessagesModule } from '../../../messages/messages.module';
import { CustomerModule } from '../../../customer/customer.module';
import { QueueModule } from '../../../customer-queue/queue.module';
import { SocketModule } from '../../../socket/socket.module';
import { OtimaApiModule } from '../otima-api.module';
import { OtimaWebhookController } from './otima-webhook.controller';
import { OtimaWebhookService } from './otima-webhook.service';

@Module({
  imports: [OtimaApiModule, SocketModule, MessagesModule, CustomerModule, QueueModule],
  controllers: [OtimaWebhookController],
  providers: [OtimaWebhookService],
  exports: [OtimaWebhookService],
})
export class OtimaWebhookModule {}


