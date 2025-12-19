import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OtimaService } from './otima.service';
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
import { OtimaSendMessageResponse } from './interfaces/otima.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Otima')
@Controller('otima')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OtimaController {
  private readonly logger = new Logger(OtimaController.name);

  constructor(private readonly otimaService: OtimaService) {}

  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send WhatsApp message via Otima',
    description: 'Sends a WhatsApp message using Otima broker API. Supports text and media messages.',
  })
  @ApiBody({
    type: OtimaSendMessageDto,
    description: 'Message details including recipient, type, and content',
  })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid message data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - failed to send message',
  })
  async sendMessage(@Body() dto: OtimaSendMessageDto): Promise<OtimaSendMessageResponse> {
    this.logger.log(`Received Otima send message request for ${dto.to}`);
    return this.otimaService.sendMessage(dto);
  }

  @Post('send-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send WhatsApp template message via Otima',
    description: 'Sends a WhatsApp template message using Otima broker API.',
  })
  @ApiBody({
    type: OtimaSendTemplateMessageDto,
    description: 'Template message details including recipient, template id, and parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Template message sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid template data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - failed to send template message',
  })
  async sendTemplate(
    @Body() dto: OtimaSendTemplateMessageDto,
  ): Promise<OtimaSendMessageResponse> {
    this.logger.log(`Received Otima send template request for ${dto.to} (${dto.templateId})`);
    return this.otimaService.sendTemplateMessage(dto);
  }

  @Post('check-whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check if WhatsApp is available for a number via Otima',
    description:
      'Checks whether a given phone number is registered on WhatsApp using the Otima broker API.',
  })
  @ApiBody({
    type: OtimaCheckWhatsappDto,
    description: 'Mobile number to verify',
  })
  @ApiResponse({
    status: 200,
    description: 'Check executed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid number',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - failed to check WhatsApp availability',
  })
  async checkWhatsapp(@Body() dto: OtimaCheckWhatsappDto): Promise<any> {
    this.logger.log(`Received Otima WhatsApp check request for ${dto.mobileExist}`);
    return this.otimaService.checkWhatsappExists(dto);
  }

  @Post('whatsapp/bulk/text')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send bulk WhatsApp text messages via Otima',
    description: 'Sends multiple WhatsApp text messages using Otima bulk text endpoint.',
  })
  @ApiBody({
    type: OtimaBulkTextMessagesDto,
    description: 'Bulk text message payload as defined by Otima API',
  })
  async sendBulkText(@Body() dto: OtimaBulkTextMessagesDto): Promise<any> {
    this.logger.log(`Received Otima bulk text request with ${dto.messages.length} messages`);
    return this.otimaService.sendBulkTextMessages(dto);
  }

  @Post('whatsapp/bulk/file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send bulk WhatsApp file/document messages via Otima',
    description: 'Sends multiple WhatsApp file/document messages using Otima bulk HSM endpoint.',
  })
  @ApiBody({
    type: OtimaBulkFileMessagesDto,
    description: 'Bulk file/document message payload as defined by Otima API',
  })
  async sendBulkFile(@Body() dto: OtimaBulkFileMessagesDto): Promise<any> {
    this.logger.log(`Received Otima bulk file request with ${dto.messages.length} messages`);
    return this.otimaService.sendBulkFileMessages(dto);
  }

  @Post('whatsapp/bulk/hsm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send bulk WhatsApp HSM messages via Otima',
    description: 'Sends multiple WhatsApp HSM messages using Otima bulk HSM endpoint.',
  })
  @ApiBody({
    type: OtimaBulkHsmMessagesDto,
    description: 'Bulk HSM message payload as defined by Otima API',
  })
  async sendBulkHsm(@Body() dto: OtimaBulkHsmMessagesDto): Promise<any> {
    this.logger.log(
      `Received Otima bulk HSM request with ${dto.messages.length} messages using template ${dto.templateCode}`,
    );
    return this.otimaService.sendBulkHsmMessages(dto);
  }

  @Post('whatsapp/hsm/file-base64')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send single WhatsApp HSM message with base64 file via Otima',
    description: 'Sends a single WhatsApp HSM message with a base64 encoded file.',
  })
  @ApiBody({
    type: OtimaSingleHsmBase64FileDto,
    description: 'Single HSM base64 file payload as defined by Otima API',
  })
  async sendSingleHsmBase64(@Body() dto: OtimaSingleHsmBase64FileDto): Promise<any> {
    this.logger.log(
      `Received Otima single HSM base64 request for ${dto.whatsapp} with template ${dto.templateCode}`,
    );
    return this.otimaService.sendSingleHsmBase64File(dto);
  }

  @Post('whatsapp/mailman/hsm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send WhatsApp mailman HSM message via Otima',
    description:
      'Sends a WhatsApp mailman HSM message (with boleto/linha digitável) using Otima mailman endpoint.',
  })
  @ApiBody({
    type: OtimaMailmanHsmDto,
    description: 'Mailman HSM payload as defined by Otima API',
  })
  async sendMailmanHsm(@Body() dto: OtimaMailmanHsmDto): Promise<any> {
    this.logger.log(
      `Received Otima mailman HSM request for ${dto.whatsapp} with template ${dto.templateCode}`,
    );
    return this.otimaService.sendMailmanHsm(dto);
  }

  @Post('whatsapp/templates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List WhatsApp HSM templates via Otima',
    description:
      'Lists WhatsApp HSM templates configured in Otima for the given customer code or the default from configuration.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerCode: { type: 'string', description: 'Otima customer code (optional)' },
      },
    },
  })
  async listTemplates(@Body('customerCode') customerCode?: string): Promise<any> {
    this.logger.log(`Received Otima list HSM templates request for customer ${customerCode}`);
    return this.otimaService.listHsmTemplates(customerCode);
  }

  @Get('whatsapp/credentials')
  @ApiOperation({
    summary: 'Get WhatsApp credentials from Otima',
    description: 'Retrieves a list of WhatsApp credentials configured in Otima, including limits and technology details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Credentials retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          credential: { type: 'string' },
          customer: { type: 'string' },
          daily_message_limit: { type: 'string' },
          direction: { type: 'string' },
          monthly_message_limit: { type: 'string' },
          name: { type: 'string' },
          sender: { type: 'string' },
          technology: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - failed to get credentials',
  })
  async getCredentials(): Promise<any> {
    this.logger.log('Received Otima get WhatsApp credentials request');
    return this.otimaService.getCredentials();
  }

  @Get('whatsapp/customers')
  @ApiOperation({
    summary: 'Get WhatsApp customers from Otima',
    description: 'Retrieves a list of WhatsApp customers configured in Otima, including callback URLs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          callbacks: {
            type: 'object',
            properties: {
              mo: { type: 'string', description: 'Mobile Originated callback URL' },
              status: { type: 'string', description: 'Status callback URL' },
            },
          },
          code: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - failed to get customers',
  })
  async getCustomers(): Promise<any> {
    this.logger.log('Received Otima get WhatsApp customers request');
    return this.otimaService.getCustomers();
  }
}


