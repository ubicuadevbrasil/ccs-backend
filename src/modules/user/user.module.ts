import { Module } from '@nestjs/common';
import { RedisModule } from '../../shared/redis.module';
import { MailModule } from '../../shared/mail.module';
import { UserController } from './user.controller';
import { UserRecoveryController } from './user-recovery.controller';
import { UserService } from './user.service';
import { PasswordRecoveryService } from './password-recovery.service';

@Module({
  imports: [RedisModule, MailModule],
  controllers: [UserController, UserRecoveryController],
  providers: [UserService, PasswordRecoveryService],
  exports: [UserService],
})
export class UserModule {}
