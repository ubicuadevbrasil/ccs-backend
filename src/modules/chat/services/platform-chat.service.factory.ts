import { Injectable, Logger } from '@nestjs/common';
import { MessagePlatform } from '../../messages/entities/message.entity';
import { ChatEvolutionService } from './chat.evolution.service';

export interface PlatformChatService {
  sendMessage(platformData: any): Promise<any>;
  checkConnection?(instanceId: string): Promise<boolean>;
  getInstanceInfo?(instanceId: string): Promise<any>;
}

@Injectable()
export class PlatformChatServiceFactory {
  private readonly logger = new Logger(PlatformChatServiceFactory.name);

  constructor(
    private readonly chatEvolutionService: ChatEvolutionService,
  ) {}

  /**
   * Get platform-specific chat service
   */
  getService(platform: MessagePlatform): PlatformChatService {
    switch (platform) {
      case MessagePlatform.WHATSAPP:
        return this.chatEvolutionService;
      case MessagePlatform.INSTAGRAM:
        // TODO: Implement Instagram service
        throw new Error('Instagram chat service not implemented yet');
      case MessagePlatform.TELEGRAM:
        // TODO: Implement Telegram service
        throw new Error('Telegram chat service not implemented yet');
      case MessagePlatform.FACEBOOK:
        // TODO: Implement Facebook service
        throw new Error('Facebook chat service not implemented yet');
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Check if platform is supported
   */
  isPlatformSupported(platform: MessagePlatform): boolean {
    const supportedPlatforms = [MessagePlatform.WHATSAPP];
    return supportedPlatforms.includes(platform);
  }

  /**
   * Get list of supported platforms
   */
  getSupportedPlatforms(): MessagePlatform[] {
    return [MessagePlatform.WHATSAPP];
  }
}
