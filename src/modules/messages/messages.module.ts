import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';
import { MessagesService } from './messages.service';
import { MessageStorageService } from './message-storage.service';
import { MessageMapperService } from './message-mapper';
import { MessagesController } from './messages.controller';
import { RedisModule } from '../../shared/redis.module';

@Module({
  imports: [KnexModule, RedisModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessageStorageService, MessageMapperService],
  exports: [MessagesService, MessageStorageService, MessageMapperService],
})
export class MessagesModule {}
