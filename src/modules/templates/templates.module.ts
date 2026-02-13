import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { OtimaApiModule } from '../whatsapp/otima/otima-api.module';

@Module({
  imports: [KnexModule, OtimaApiModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}

