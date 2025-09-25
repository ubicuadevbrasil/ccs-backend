import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
  imports: [KnexModule],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
