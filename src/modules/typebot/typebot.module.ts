import { Module, forwardRef } from '@nestjs/common';
import { TypebotController } from './typebot.controller';
import { TypebotService } from './typebot.service';
import { TypebotAuthService } from './typebot-auth.service';
import { UsersModule } from '../users/users.module';
import { QueuesModule } from '../queues/queues.module';
import { SocketModule } from '../socket/socket.module';
import { AuthModule } from '../auth/auth.module';
import { EvolutionModule } from '../evolution/evolution.module';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [UsersModule, forwardRef(() => QueuesModule), EvolutionModule, forwardRef(() => SocketModule), AuthModule, SchedulerModule],
  controllers: [TypebotController],
  providers: [TypebotService, TypebotAuthService],
  exports: [TypebotService, TypebotAuthService],
})
export class TypebotModule {} 