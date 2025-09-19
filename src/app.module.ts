import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './modules/user';
import { CustomerModule } from './modules/customer';
import { TabulationModule } from './modules/tabulation';
import { HistoryModule } from './modules/history';
import { QueueModule } from './modules/customer-queue';
import { EvolutionModule } from './modules/whatsapp/evolution/evolution.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UserModule,
    CustomerModule,
    TabulationModule,
    HistoryModule,
    QueueModule,
    EvolutionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
