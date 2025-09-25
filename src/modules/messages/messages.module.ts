import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';
import { MessagesService } from './messages.service';
import { MessageStorageService } from './message-storage.service';
import { MessagesController } from './messages.controller';
import { RedisModule } from '../../shared/redis.module';

@Module({
  imports: [KnexModule, RedisModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessageStorageService],
  exports: [MessagesService, MessageStorageService],
})
export class MessagesModule {}
