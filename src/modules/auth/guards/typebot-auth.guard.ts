import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TypebotAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const apiKey = this.configService.get<string>('TYPEBOT_API_KEY');

    if (!apiKey) {
      throw new UnauthorizedException('Typebot API key not configured');
    }

    if (token !== apiKey) {
      throw new UnauthorizedException('Invalid Typebot API key');
    }

    return true;
  }
} 