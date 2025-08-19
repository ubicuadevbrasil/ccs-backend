import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypebotAuthPayload } from './interfaces/typebot.interface';

@Injectable()
export class TypebotAuthService {
  constructor(private configService: ConfigService) {}

  /**
   * Generate a non-expiring token for Typebot authentication
   * This token is based on a configured API key and never expires
   */
  generateToken(): string {
    const apiKey = this.configService.get<string>('TYPEBOT_API_KEY');
    if (!apiKey) {
      throw new Error('TYPEBOT_API_KEY not configured');
    }
    return apiKey;
  }

  /**
   * Validate a Typebot token
   * Since these are non-expiring tokens, we only check if they match the configured API key
   */
  validateToken(token: string): boolean {
    const apiKey = this.configService.get<string>('TYPEBOT_API_KEY');
    return apiKey === token;
  }

  /**
   * Create a payload for Typebot requests
   */
  createPayload(sessionId?: string): TypebotAuthPayload {
    return {
      typebotId: 'typebot-system',
      sessionId: sessionId || 'system-session',
      timestamp: Date.now(),
    };
  }

  /**
   * Get the current API key for reference
   */
  getApiKey(): string | undefined {
    return this.configService.get<string>('TYPEBOT_API_KEY');
  }
} 