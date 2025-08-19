import { Module } from '@nestjs/common';
import { StartupService } from './startup.service';
import { StartupController } from './startup.controller';
import { GroupModule } from '../group/group.module';
import { EvolutionModule } from '../evolution/evolution.module';

@Module({
  imports: [GroupModule, EvolutionModule],
  controllers: [StartupController],
  providers: [StartupService],
  exports: [StartupService],
})
export class StartupModule {}