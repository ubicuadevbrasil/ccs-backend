import { Module } from '@nestjs/common';
import { TabulationsService } from './tabulations.service';
import { TabulationsController } from './tabulations.controller';
import { TabulationStatusModule } from '../tabulation-status/tabulation-status.module';

@Module({
  imports: [TabulationStatusModule],
  controllers: [TabulationsController],
  providers: [TabulationsService],
  exports: [TabulationsService],
})
export class TabulationsModule {}
