import { Module } from '@nestjs/common';
import { AnalyticalModule } from './analytical/analytical.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [AnalyticalModule, WhatsAppModule, ServicesModule],
  exports: [AnalyticalModule, WhatsAppModule, ServicesModule],
})
export class DashboardModule {}
