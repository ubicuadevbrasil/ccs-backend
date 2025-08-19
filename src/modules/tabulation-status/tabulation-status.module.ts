import { Module } from '@nestjs/common';
import { TabulationStatusService } from './tabulation-status.service';
import { TabulationStatusController } from './tabulation-status.controller';
import { TabulationStatusSubService } from './tabulation-status-sub.service';
import { TabulationStatusSubController } from './tabulation-status-sub.controller';

@Module({
  controllers: [
    TabulationStatusController,
    TabulationStatusSubController,
  ],
  providers: [
    TabulationStatusService,
    TabulationStatusSubService,
  ],
  exports: [
    TabulationStatusService,
    TabulationStatusSubService,
  ],
})
export class TabulationStatusModule {}
