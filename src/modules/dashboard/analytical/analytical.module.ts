import { Module } from '@nestjs/common';
import { AnalyticalController } from './analytical.controller';
import { AnalyticalService } from './analytical.service';

@Module({
  controllers: [AnalyticalController],
  providers: [AnalyticalService],
  exports: [AnalyticalService],
})
export class AnalyticalModule {}
