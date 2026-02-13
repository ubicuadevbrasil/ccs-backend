import { Injectable, Inject, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { UserService } from './user.service';
import { MailService } from '../../shared/mail.service';

const REDIS_KEY_PREFIX = 'password_recovery:';
const DEFAULT_TTL_SECONDS = 900;
const RECOVERY_CODE_INVALID_MESSAGE = 'Código inválido ou expirado.';
const SEND_SUCCESS_MESSAGE = 'Se o e-mail estiver cadastrado, você receberá um código de recuperação.';

/**
 * Generates a 6-digit numeric code for password recovery.
 */
function generateRecoveryCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

@Injectable()
export class PasswordRecoveryService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  private getRedisKey(email: string): string {
    return `${REDIS_KEY_PREFIX}${email.trim().toLowerCase()}`;
  }

  private getTtlSeconds(): number {
    return this.configService.get<number>('PASSWORD_RECOVERY_CODE_TTL_SECONDS', DEFAULT_TTL_SECONDS);
  }

  /**
   * Sends a recovery code to the user's email if the account exists.
   * Always returns the same generic success to avoid user enumeration.
   */
  async sendRecoveryCode(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userService.findUserByEmail(normalizedEmail);
    if (!user) {
      return { message: SEND_SUCCESS_MESSAGE };
    }
    const code = generateRecoveryCode();
    const key = this.getRedisKey(normalizedEmail);
    const ttl = this.getTtlSeconds();
    await this.redis.setex(key, ttl, code);
    try {
      await this.mailService.sendPasswordRecoveryEmail(user.email, user.name, code);
    } catch {
      await this.redis.del(key);
      throw new ServiceUnavailableException('Não foi possível enviar o e-mail. Tente novamente mais tarde.');
    }
    return { message: SEND_SUCCESS_MESSAGE };
  }

  /**
   * Validates the recovery code without consuming it. Returns valid: true if code matches Redis.
   */
  async validateRecoveryCode(email: string, code: string): Promise<{ valid: boolean }> {
    const normalizedEmail = email.trim().toLowerCase();
    const key = this.getRedisKey(normalizedEmail);
    const storedCode = await this.redis.get(key);
    if (!storedCode || storedCode !== code.trim()) {
      throw new BadRequestException(RECOVERY_CODE_INVALID_MESSAGE);
    }
    return { valid: true };
  }

  /**
   * Validates the code and updates the user password. Single use: code is deleted after success.
   */
  async recoverPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const key = this.getRedisKey(normalizedEmail);
    const storedCode = await this.redis.get(key);
    if (!storedCode || storedCode !== code.trim()) {
      throw new BadRequestException(RECOVERY_CODE_INVALID_MESSAGE);
    }
    const user = await this.userService.findUserByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException(RECOVERY_CODE_INVALID_MESSAGE);
    }
    await this.userService.updateUser(user.id, { password: newPassword });
    await this.redis.del(key);
    return { message: 'Senha alterada com sucesso.' };
  }
}
