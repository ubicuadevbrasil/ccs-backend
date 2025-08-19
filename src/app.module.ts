import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { EvolutionModule } from './modules/evolution/evolution.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { SocketModule } from './modules/socket/socket.module';
import { ChatModule } from './modules/chat/chat.module';
import { GroupModule } from './modules/group/group.module';
import { CustomerModule } from './modules/customer/customer.module';
import { QueuesModule } from './modules/queues/queues.module';
import { StartupModule } from './modules/startup/startup.module';
import { TypebotModule } from './modules/typebot/typebot.module';
import { MessagesModule } from './modules/messages/messages.module';
import { TabulationsModule } from './modules/tabulations/tabulations.module';
import { TabulationStatusModule } from './modules/tabulation-status/tabulation-status.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MessageTemplatesModule } from './modules/message-templates/message-templates.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    EvolutionModule,
    ChatModule,
    GroupModule,
    CustomerModule,
    QueuesModule,
    WebhookModule,
    SocketModule,
    StartupModule,
    TypebotModule,
    MessagesModule,
    TabulationsModule,
    TabulationStatusModule,
    DashboardModule,
    MessageTemplatesModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
