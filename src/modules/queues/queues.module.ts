import { Module, forwardRef } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { QueuesController } from './queues.controller';
import { CustomerModule } from '../customer/customer.module';
import { EvolutionModule } from '../evolution/evolution.module';
import { ConfigModule } from '@nestjs/config';
import { SocketModule } from '../socket/socket.module';
import { TabulationsModule } from '../tabulations/tabulations.module';

@Module({
  imports: [CustomerModule, EvolutionModule, ConfigModule, forwardRef(() => SocketModule), TabulationsModule],
  controllers: [QueuesController],
  providers: [QueuesService],
  exports: [QueuesService],
})
export class QueuesModule {} 