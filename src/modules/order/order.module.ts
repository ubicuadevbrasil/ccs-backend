import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [KnexModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}


