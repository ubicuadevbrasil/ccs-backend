import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EvolutionService } from './evolution.service';

@Module({
  imports: [ConfigModule],
  providers: [EvolutionService],
  exports: [EvolutionService],
})
export class EvolutionModule {} 