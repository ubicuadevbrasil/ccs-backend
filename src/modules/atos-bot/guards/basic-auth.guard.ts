import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Basic Authentication Guard for Atos Bot API endpoints
 * Validates Basic Auth credentials from Authorization header
 */
@Injectable()
export class BasicAuthGuard implements CanActivate {
  private readonly username: string;
  private readonly password: string;

  constructor(private readonly configService: ConfigService) {
    // Default credentials from legacy code
    // TODO: Move to environment variables
    this.username = this.configService.get<string>('ATOS_BOT_AUTH_USERNAME') || 'atosBot';
    this.password = this.configService.get<string>('ATOS_BOT_AUTH_PASSWORD') || 'd8511353660467bb8e8c68016053bd9e';
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Sorry! Invalid Authentication.');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Basic') {
      throw new UnauthorizedException('Sorry! Invalid Authentication.');
    }

    try {
      const buffer = Buffer.from(parts[1], 'base64');
      const plainAuth = buffer.toString('utf-8');
      const [username, password] = plainAuth.split(':');

      if (username === this.username && password === this.password) {
        return true;
      }

      throw new UnauthorizedException('Sorry! Unauthorized Access.');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Sorry! Invalid Authentication.');
    }
  }
}

