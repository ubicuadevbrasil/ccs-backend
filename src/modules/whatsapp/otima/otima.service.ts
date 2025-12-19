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
      const response: AxiosResponse<OtimaSendMessageResponse> = await this.axiosInstance.post(
        endpoint,
        payload,
      );
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to send message via Otima');
    }
  }

  async sendTemplateMessage(templateDto: OtimaSendTemplateMessageDto): Promise<OtimaSendMessageResponse> {
    try {
      this.logger.log(`Sending Otima WhatsApp template ${templateDto.templateId} to ${templateDto.to}`);
      const payload = this.buildSendTemplatePayload(templateDto);
      const response: AxiosResponse<OtimaSendMessageResponse> = await this.axiosInstance.post(
        '/v1/whatsapp/message/hsm',
        payload,
      );
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to send template message via Otima');
    }
  }

  async checkWhatsappExists(checkDto: OtimaCheckWhatsappDto): Promise<any> {
    try {
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
        messages: dto.messages.map((message) => ({
          date: message.date,
          document: message.document,
          text: message.text,
          whatsapp: message.whatsapp,
        })),
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
        messages: dto.messages.map((message) => ({
          date: message.date,
          document: message.document,
          file: message.file,
          whatsapp: message.whatsapp,
        })),
      };
      const response = await this.axiosInstance.post('/v1/whatsapp/bulk/message/hsm', body);
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
        messages: dto.messages.map((message) => ({
          date: message.date,
          document: message.document,
          hsm_file: message.hsm_file,
          url_callback_mo: message.url_callback_mo,
          url_callback_status: message.url_callback_status,
          variables: message.variables,
          whatsapp: message.whatsapp,
        })),
      };
      const response = await this.axiosInstance.post('/v1/whatsapp/bulk/message/hsm', body);
      return response.data;
    } catch (error) {
      throw this.buildHttpException(error, 'Failed to send bulk HSM messages via Otima');
    }
  }

  async sendSingleHsmBase64File(dto: OtimaSingleHsmBase64FileDto): Promise<any> {
    try {
      const body = {
        broker_code: dto.brokerCode || this.config.brokerCode,
        customer_code: dto.customerCode || this.config.customerCode,
        date: dto.date,
        document: dto.document,
        file: dto.file,
        template_code: dto.templateCode,
        variables: dto.variables,
        whatsapp: dto.whatsapp,
      };
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
      const body = {
        broker_code: dto.brokerCode || this.config.brokerCode,
        customer_code: dto.customerCode || this.config.customerCode,
        date: dto.date,
        document: dto.document,
        failed_message: dto.failed_message,
        file: dto.file,
        linha_digitavel: dto.linha_digitavel,
        template_code: dto.templateCode,
        variables: dto.variables,
        whatsapp: dto.whatsapp,
      };
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
    if (sendMessageDto.type === 'text') {
      return {
        number: sendMessageDto.to,
        text: sendMessageDto.text,
      };
    }
    return {
      number: sendMessageDto.to,
      url: sendMessageDto.mediaUrl,
      caption: sendMessageDto.caption,
    };
  }

  private buildSendTemplatePayload(templateDto: OtimaSendTemplateMessageDto): any {
    return {
      number: templateDto.to,
      templateCode: templateDto.templateId,
      parameters: templateDto.parameters ?? [],
    };
  }

  /**
   * Get Otima WhatsApp endpoint based on message type
   * According to Otima docs, text and file/url messages use different endpoints.
   */
  private getSendMessageEndpoint(sendMessageDto: OtimaSendMessageDto): string {
    if (sendMessageDto.type === 'text') {
      return '/v1/whatsapp/message/text';
    }
    return '/v1/whatsapp/message/file/url';
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


