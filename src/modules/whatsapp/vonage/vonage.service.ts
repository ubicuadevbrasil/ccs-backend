import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  VonageConfig,
  VonageSendMessageRequest,
  VonageSendMessageResponse,
  VonageMessageContent,
  VonageMessageType,
  VonageTemplateParameters,
} from './interfaces/vonage.interface';
import { SendMessageDto } from './dto/vonage.dto';

/**
 * Vonage WhatsApp Business API Service
 * Handles communication with Vonage Communications APIs
 */
@Injectable()
export class VonageService {
  private readonly logger = new Logger(VonageService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly config: VonageConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.getVonageConfig();
    this.axiosInstance = this.createAxiosInstance();
  }

  /**
   * Get Vonage configuration from environment variables
   */
  private getVonageConfig(): VonageConfig {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    return {
      number: isProduction 
        ? this.configService.get<string>('VONAGE_MOBILE', '')
        : this.configService.get<string>('SANDBOX_MOBILE', ''),
      messageUrl: isProduction
        ? this.configService.get<string>('VONAGE_MESSAGE_URL', '')
        : this.configService.get<string>('SANDBOX_MESSAGE_URL', ''),
      user: isProduction
        ? this.configService.get<string>('VONAGE_USER', '')
        : this.configService.get<string>('SANDBOX_USER', ''),
      password: isProduction
        ? this.configService.get<string>('VONAGE_PASSWORD', '')
        : this.configService.get<string>('SANDBOX_PASSWORD', ''),
      isProduction,
    };
  }

  /**
   * Create axios instance with authentication
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.messageUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      auth: {
        username: this.config.user,
        password: this.config.password,
      },
    });
  }

  /**
   * Send a message via Vonage Messages API v1
   */
  async sendMessage(sendMessageDto: SendMessageDto): Promise<VonageSendMessageResponse> {
    try {
      this.logger.log(`Sending message to ${sendMessageDto.toNumber} via Vonage`);

      const requestPayload = this.createMessageContent(sendMessageDto);

      console.log('\n=== VONAGE API REQUEST ===');
      console.log('URL:', this.config.messageUrl);
      console.log('Request Body:', JSON.stringify(requestPayload, null, 2));
      console.log('=== END VONAGE REQUEST ===\n');

      const response: AxiosResponse<VonageSendMessageResponse> = await this.axiosInstance.post(
        '',
        requestPayload
      );

      console.log('✅ VONAGE SUCCESS - Message sent! UUID:', response.data.message_uuid);
      this.logger.log(`Message sent successfully. UUID: ${response.data.message_uuid}`);
      return response.data;

    } catch (error) {
      console.log('❌ VONAGE ERROR - Failed to send message');
      // console.log('Error details:', error.response?.data || error.message);
      // this.logger.error('Error sending message via Vonage:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message;
        throw new HttpException(
          `Failed to send message via Vonage: ${errorMessage}`,
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      
      throw new HttpException(
        'Failed to send message via Vonage',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create message content based on message type for v1 API
   */
  private createMessageContent(sendMessageDto: SendMessageDto): any {
    const { type, txtMessage, mediaUrl, mediaCaption, template_name, template_namespace, parameters, components, contextMessageUuid } = sendMessageDto;

    const baseMessage = {
      to: sendMessageDto.toNumber,
      from: this.config.number.replace('@c.us', ''),
      channel: 'whatsapp' as const,
      ...(contextMessageUuid && {
        context: {
          message_uuid: contextMessageUuid,
        },
      }),
    };

    switch (type) {
      case 'text':
        return {
          ...baseMessage,
          message_type: 'text',
          text: txtMessage || '',
        };

      case 'image':
        return {
          ...baseMessage,
          message_type: 'image',
          image: {
            url: mediaUrl || '',
            caption: mediaCaption,
          },
        };

      case 'video':
        return {
          ...baseMessage,
          message_type: 'video',
          video: {
            url: mediaUrl || '',
            caption: mediaCaption,
          },
        };

      case 'audio':
        return {
          ...baseMessage,
          message_type: 'audio',
          audio: {
            url: mediaUrl || '',
          },
        };

      case 'file':
        return {
          ...baseMessage,
          message_type: 'file',
          file: {
            url: mediaUrl || '',
            caption: mediaCaption,
          },
        };

      case 'template_mtm':
        return {
          ...baseMessage,
          message_type: 'template',
          template: {
            name: `${template_namespace}:${template_name}`,
            parameters: parameters || [],
          },
        };

      case 'template_custom':
        return {
          ...baseMessage,
          message_type: 'custom',
          custom: {
            type: 'template',
            template: {
              namespace: template_namespace || '',
              name: template_name || '',
              components: components || [],
              language: {
                policy: 'deterministic',
                code: 'pt_BR',
              },
            },
          },
        };

      case 'template_optin':
        return {
          ...baseMessage,
          message_type: 'custom',
          custom: {
            type: 'template',
            template: {
              namespace: 'f8ad1a58_f790_49a8_b757_04a56bfd7bc3',
              name: 'sanofi_optin',
              language: {
                code: 'pt_BR',
                policy: 'deterministic',
              },
              components: [],
            },
          },
        };

      case 'template_chatweb_prd':
        return {
          ...baseMessage,
          message_type: 'custom',
          custom: {
            type: 'template',
            template: {
              namespace: 'f8ad1a58_f790_49a8_b757_04a56bfd7bc3',
              name: 'sanofi_link_chatweb_prd',
              language: {
                code: 'pt_BR',
                policy: 'deterministic',
              },
              components: components || [],
            },
          },
        };

      case 'template_chatweb_hml':
        return {
          ...baseMessage,
          message_type: 'custom',
          custom: {
            type: 'template',
            template: {
              namespace: 'f8ad1a58_f790_49a8_b757_04a56bfd7bc3',
              name: 'sanofi_link_chatweb_hml',
              language: {
                code: 'pt_BR',
                policy: 'deterministic',
              },
              components: components || [],
            },
          },
        };

      default:
        throw new HttpException(
          `Unsupported message type: ${type}`,
          HttpStatus.BAD_REQUEST
        );
    }
  }

  /**
   * Get current configuration (for debugging)
   */
  getConfig(): Partial<VonageConfig> {
    return {
      number: this.config.number,
      messageUrl: this.config.messageUrl,
      isProduction: this.config.isProduction,
    };
  }
}
