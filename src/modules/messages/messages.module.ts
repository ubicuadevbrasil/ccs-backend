import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';
import { MessagesService } from './messages.service';

@Module({
  imports: [KnexModule],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
