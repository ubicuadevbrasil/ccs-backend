import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { EvolutionModule } from '../evolution/evolution.module';
import { DatabaseModule } from '../../database/database.module';
import { MessagesModule } from '../messages/messages.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [EvolutionModule, DatabaseModule, MessagesModule, SocketModule],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {} 