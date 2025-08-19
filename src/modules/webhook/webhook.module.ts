import { Module, forwardRef } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { MessagesModule } from '../messages/messages.module';
import { QueuesModule } from '../queues/queues.module';
import { EvolutionModule } from '../evolution/evolution.module';
import { SocketModule } from '../socket/socket.module';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [
    MessagesModule,
    forwardRef(() => QueuesModule),
    EvolutionModule,
    forwardRef(() => SocketModule),
    forwardRef(() => GroupModule),
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {} 