import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';
import { TabulationController } from './tabulation.controller';
import { TabulationService } from './tabulation.service';

@Module({
  imports: [KnexModule],
  controllers: [TabulationController],
  providers: [TabulationService],
  exports: [TabulationService],
})
export class TabulationModule {}
