import { Injectable, Logger } from '@nestjs/common';
import { MessagePlatform } from '../../messages/entities/message.entity';
import { ChatVonageService } from './chat.vonage.service';
import { ChatOtimaService } from './chat.otima.service';
import { ConfigService } from '@nestjs/config';

export interface PlatformChatService {
  sendMessage(platformData: any): Promise<any>;
  checkConnection?(instanceId: string): Promise<boolean>;
  getInstanceInfo?(instanceId: string): Promise<any>;
}

@Injectable()
export class PlatformChatServiceFactory {
  private readonly logger = new Logger(PlatformChatServiceFactory.name);

  constructor(
    private readonly chatVonageService: ChatVonageService,
    private readonly chatOtimaService: ChatOtimaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get platform-specific chat service
   */
  getService(platform: MessagePlatform): PlatformChatService {
    const whatsappProvider = this.configService.get<string>('WHATSAPP_PROVIDER') ?? 'vonage';
    switch (platform) {
      case MessagePlatform.WHATSAPP:
        return whatsappProvider === 'otima' ? this.chatOtimaService : this.chatVonageService;
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
