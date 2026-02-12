import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  OtimaSendMessageDto,
  OtimaSendTemplateMessageDto,
  OtimaCheckWhatsappDto,
  OtimaBulkTextMessagesDto,
  OtimaBulkFileMessagesDto,
  OtimaBulkHsmMessagesDto,
  OtimaSingleHsmBase64FileDto,
  OtimaMailmanHsmDto,
} from './dto/otima.dto';
import {
  OtimaConfig,
  OtimaSendMessageResponse,
  OtimaCredentialResponse,
  OtimaCustomerResponse,
} from './interfaces/otima.interface';

@Injectable()
export class OtimaService {
  private readonly logger = new Logger(OtimaService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly config: OtimaConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.getOtimaConfig();
    this.axiosInstance = this.createAxiosInstance();
  }

  getConfig(): OtimaConfig {
    return this.config;
  }

  private getOtimaConfig(): OtimaConfig {
    const baseUrl =
      this.configService.get<string>('OTIMA_BASE_URL') || 'https://services.otima.digital';
    const apiKey = this.configService.get<string>('OTIMA_API_KEY');
    const whatsappWebhookSecret = this.configService.get<string>('OTIMA_WHATSAPP_WEBHOOK_SECRET');
    const brokerCode = this.configService.get<string>('OTIMA_BROKER_CODE');
    const customerCode = this.configService.get<string>('OTIMA_CUSTOMER_CODE');
    if (!apiKey) {
      throw new Error('Otima configuration is not properly defined');
    }
    return {
      baseUrl,
      apiKey,
      whatsappWebhookSecret,
      brokerCode,
      customerCode,
    };
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseUrl,
      timeout: 10000,
      headers: {
        Authorization: `${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(sendMessageDto: OtimaSendMessageDto): Promise<OtimaSendMessageResponse> {
    try {
      this.logger.log(`Sending Otima WhatsApp message to ${sendMessageDto.to} (${sendMessageDto.type})`);
      const payload = this.buildSendMessagePayload(sendMessageDto);
      const endpoint = this.getSendMessageEndpoint(sendMessageDto);
      // Bulk endpoints return arrays, extract first element for single message
      const response: AxiosResponse<any[]> = await this.axiosInstance.post(endpoint, payload);
      const result = response.data?.[0];
      if (!result) {
        throw new HttpException('No response data received', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      // Map the response to match OtimaSendMessageResponse interface
      return {
        messageId: result.message_id || '',
        status: result.status || '',
        to: result.phone || sendMessageDto.to,
        timestamp: result.status_description,
      };
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to send message via Otima');
    }
  }

  async sendTemplateMessage(templateDto: OtimaSendTemplateMessageDto): Promise<OtimaSendMessageResponse> {
    try {
      this.logger.log(`Sending Otima WhatsApp template ${templateDto.templateId} to ${templateDto.to}`);
      const payload = this.buildSendTemplatePayload(templateDto);
      // Bulk endpoints return arrays, extract first element for single message
      const response: AxiosResponse<any[]> = await this.axiosInstance.post(
        '/v1/whatsapp/bulk/message/hsm',
        payload,
      );
      const result = response.data?.[0];
      if (!result) {
        throw new HttpException('No response data received', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      // Map the response to match OtimaSendMessageResponse interface
      return {
        messageId: result.message_id || '',
        status: result.status || '',
        to: result.phone || templateDto.to,
        timestamp: result.status_description,
      };
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to send template message via Otima');
    }
  }

  async checkWhatsappExists(checkDto: OtimaCheckWhatsappDto): Promise<any> {
    try {
      // Note: The /v1/whatsapp/validate/number endpoint is not documented in the OpenAPI spec
      // This method may need to be updated or removed if the endpoint doesn't exist
      const infraMobile = this.configService.get<string>('CCS_MOBILE');
      const response = await this.axiosInstance.post('/v1/whatsapp/validate/number', {
        mobile: infraMobile,
        mobileExist: checkDto.mobileExist,
      });
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to check WhatsApp availability via Otima');
    }
  }

  async sendBulkTextMessages(dto: OtimaBulkTextMessagesDto): Promise<any> {
    try {
      const body = {
        broker_code: dto.brokerCode || this.config.brokerCode,
        customer_code: dto.customerCode || this.config.customerCode,
        messages: dto.messages.map((message) => {
          const mapped: any = {
          text: message.text,
          whatsapp: message.whatsapp,
          };
          if (message.date) {
            mapped.date = message.date;
          }
          if (message.document) {
            mapped.document = message.document;
          }
          if (message.extra_fields) {
            mapped.extra_fields = message.extra_fields;
          }
          return mapped;
        }),
      };
      const response = await this.axiosInstance.post('/v1/whatsapp/bulk/message/text', body);
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to send bulk text messages via Otima');
    }
  }

  async sendBulkFileMessages(dto: OtimaBulkFileMessagesDto): Promise<any> {
    try {
      const body = {
        broker_code: dto.brokerCode || this.config.brokerCode,
        customer_code: dto.customerCode || this.config.customerCode,
        messages: dto.messages.map((message) => {
          const mapped: any = {
            file: {
              file: message.file.file,
              mime_type: message.file.mime_type,
            },
          whatsapp: message.whatsapp,
          };
          if (message.file.caption) {
            mapped.file.caption = message.file.caption;
          }
          if (message.date) {
            mapped.date = message.date;
          }
          if (message.document) {
            mapped.document = message.document;
          }
          if (message.extra_fields) {
            mapped.extra_fields = message.extra_fields;
          }
          return mapped;
        }),
      };
      const response = await this.axiosInstance.post('/v1/whatsapp/bulk/message/document', body);
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to send bulk file messages via Otima');
    }
  }

  async sendBulkHsmMessages(dto: OtimaBulkHsmMessagesDto): Promise<any> {
    try {
      const body = {
        broker_code: dto.brokerCode || this.config.brokerCode,
        customer_code: dto.customerCode || this.config.customerCode,
        template_code: dto.templateCode,
        messages: dto.messages.map((message) => {
          const mapped: any = {
          whatsapp: message.whatsapp,
          };
          if (message.date) {
            mapped.date = message.date;
          }
          if (message.document) {
            mapped.document = message.document;
          }
          if (message.extra_fields) {
            mapped.extra_fields = message.extra_fields;
          }
          if (message.hsm_file) {
            mapped.hsm_file = {
              name: message.hsm_file.name,
              url: message.hsm_file.url,
            };
          }
          if (message.url_callback_mo) {
            mapped.url_callback_mo = message.url_callback_mo;
          }
          if (message.url_callback_status) {
            mapped.url_callback_status = message.url_callback_status;
          }
          if (message.variables) {
            mapped.variables = message.variables;
          }
          return mapped;
        }),
      };
      const response = await this.axiosInstance.post('/v1/whatsapp/bulk/message/hsm', body);
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to send bulk HSM messages via Otima');
    }
  }

  async sendSingleHsmBase64File(dto: OtimaSingleHsmBase64FileDto): Promise<any> {
    try {
      const body: any = {
        broker_code: dto.brokerCode || this.config.brokerCode,
        customer_code: dto.customerCode || this.config.customerCode,
        document: dto.document,
        file: {
          base64_data: dto.file.base64_data,
          mime_type: dto.file.mime_type,
          name: dto.file.name,
        },
        template_code: dto.templateCode,
        whatsapp: dto.whatsapp,
      };
      if (dto.date) {
        body.date = dto.date;
      }
      if (dto.extra_fields) {
        body.extra_fields = dto.extra_fields;
      }
      if (dto.text) {
        body.text = dto.text;
      }
      if (dto.variables) {
        body.variables = dto.variables;
      }
      const response = await this.axiosInstance.post(
        '/v1/whatsapp/message/hsm/file/base64',
        body,
      );
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to send single HSM base64 file via Otima');
    }
  }

  async sendMailmanHsm(dto: OtimaMailmanHsmDto): Promise<any> {
    try {
      const body: any = {
        broker_code: dto.brokerCode || this.config.brokerCode,
        customer_code: dto.customerCode || this.config.customerCode,
        document: dto.document,
        file: {
          base64_data: dto.file.base64_data,
          mime_type: dto.file.mime_type,
          name: dto.file.name,
        },
        linha_digitavel: dto.linha_digitavel,
        template_code: dto.templateCode,
        whatsapp: dto.whatsapp,
      };
      if (dto.date) {
        body.date = dto.date;
      }
      if (dto.failed_message) {
        body.failed_message = dto.failed_message;
      }
      if (dto.variables) {
        body.variables = dto.variables;
      }
      const response = await this.axiosInstance.post('/v1/whatsapp/message/mailman/hsm', body);
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to send mailman HSM message via Otima');
    }
  }

  async listHsmTemplates(customerCode?: string): Promise<any> {
    try {
      const code = customerCode || this.config.customerCode;
      const response = await this.axiosInstance.get(`/v1/whatsapp/template/hsm/${code}`);
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to list HSM templates via Otima');
    }
  }

  async getCredentials(): Promise<OtimaCredentialResponse[]> {
    try {
      this.logger.log('Fetching Otima WhatsApp credentials');
      const response = await this.axiosInstance.get<OtimaCredentialResponse[]>('/v1/whatsapp/credential');
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to get WhatsApp credentials from Otima');
    }
  }

  async getCustomers(): Promise<OtimaCustomerResponse[]> {
    try {
      this.logger.log('Fetching Otima WhatsApp customers');
      const response = await this.axiosInstance.get<OtimaCustomerResponse[]>('/v1/whatsapp/customer');
      console.log('Customers:', response.data);
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to get WhatsApp customers from Otima');
    }
  }

  private buildSendMessagePayload(sendMessageDto: OtimaSendMessageDto): any {
    const brokerCode = this.config.brokerCode;
    const customerCode = this.config.customerCode;
    
    if (sendMessageDto.type === 'text') {
      return {
        broker_code: brokerCode,
        customer_code: customerCode,
        messages: [
          {
            whatsapp: sendMessageDto.to,
            text: sendMessageDto.text,
          },
        ],
      };
    }
    // For file/document messages, use bulk document endpoint
    if (!sendMessageDto.mediaUrl) {
      throw new HttpException('Media URL is required for file/document messages', HttpStatus.BAD_REQUEST);
    }
    return {
      broker_code: brokerCode,
      customer_code: customerCode,
      messages: [
        {
          whatsapp: sendMessageDto.to,
          file: {
            file: sendMessageDto.mediaUrl,
            mime_type: this.getMimeTypeFromUrl(sendMessageDto.mediaUrl),
            ...(sendMessageDto.caption && { caption: sendMessageDto.caption }),
          },
        },
      ],
    };
  }

  private buildSendTemplatePayload(templateDto: OtimaSendTemplateMessageDto): any {
    const brokerCode = this.config.brokerCode;
    const customerCode = this.config.customerCode;
    
    // Convert parameters array to variables object format if needed
    const variables: Record<string, string> = {};
    if (templateDto.parameters && templateDto.parameters.length > 0) {
      templateDto.parameters.forEach((param, index) => {
        variables[`-var${index + 1}-`] = param;
      });
    }
    
    return {
      broker_code: brokerCode,
      customer_code: customerCode,
      template_code: templateDto.templateId,
      messages: [
        {
          whatsapp: templateDto.to,
          ...(Object.keys(variables).length > 0 && { variables }),
        },
      ],
    };
  }

  /**
   * Get Otima WhatsApp endpoint based on message type
   * According to Otima OpenAPI spec, use bulk endpoints for single messages.
   */
  private getSendMessageEndpoint(sendMessageDto: OtimaSendMessageDto): string {
    if (sendMessageDto.type === 'text') {
      return '/v1/whatsapp/bulk/message/text';
    }
    return '/v1/whatsapp/bulk/message/document';
  }

  /**
   * Helper method to determine MIME type from URL or file extension
   */
  private getMimeTypeFromUrl(url: string): string {
    if (!url) return 'application/octet-stream';
    
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  private buildHttpException(error: unknown, defaultMessage: string): HttpException {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const errorMessage = (error.response?.data as any)?.error || error.message || defaultMessage;
      this.logger.error(errorMessage);
      return new HttpException(errorMessage, status);
    }
    this.logger.error(defaultMessage);
    return new HttpException(defaultMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}


