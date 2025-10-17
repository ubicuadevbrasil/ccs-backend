import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { UserModule } from './modules/user';
import { CustomerModule } from './modules/customer';
import { TabulationModule } from './modules/tabulation';
import { HistoryModule } from './modules/history';
import { QueueModule } from './modules/customer-queue';
import { EvolutionModule } from './modules/whatsapp/evolution/evolution.module';
import { AuthModule } from './modules/auth/auth.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ChatModule } from './modules/chat/chat.module';
import { OrderModule } from './modules/order';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    CommonModule,
    AuthModule,
    UserModule,
    CustomerModule,
    TabulationModule,
    HistoryModule,
    QueueModule,
    // EvolutionModule, Not using for Sanofi
    // VonageModule TODO:
    MessagesModule,
    OrderModule,
    // ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
