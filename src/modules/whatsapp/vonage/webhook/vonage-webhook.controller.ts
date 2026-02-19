import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { 
  InboundMessageWebhookDto, 
  StatusWebhookDto,
  SandboxInboundMessageWebhookDto,
  SandboxStatusWebhookDto 
} from '../dto/vonage.dto';
import { VonageWebhookService } from './vonage-webhook.service';

/**
 * Vonage Webhook Controller
 * Handles incoming webhooks from Vonage WhatsApp Business API
 */
@ApiTags('Vonage Webhook')
@Controller('vonage/webhook')
export class VonageWebhookController {
  private readonly logger = new Logger(VonageWebhookController.name);

  constructor(private readonly vonageWebhookService: VonageWebhookService) {}

  /**
   * Handle inbound message webhook from Vonage
   * Supports both production and sandbox environments
   */
  @Post('inbound-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Handle inbound message webhook',
    description: 'Processes incoming WhatsApp messages from Vonage webhook. Supports both production and sandbox environments.'
  })
  @ApiBody({ 
    description: 'Inbound message webhook payload from Vonage (production or sandbox format)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully' 
  })
  async handleInboundMessage(
    @Body() webhookData: InboundMessageWebhookDto | SandboxInboundMessageWebhookDto,
    @Res() res: Response
  ): Promise<void> {
    const isProduction = process.env.NODE_ENV === 'production';
    const messageUuid = webhookData.message_uuid;
    
    this.logger.log(`Received inbound message webhook (${isProduction ? 'production' : 'sandbox'}): ${messageUuid}`);
    
    try {
      if (isProduction) {
        await this.vonageWebhookService.processInboundMessage(webhookData as InboundMessageWebhookDto);
      } else {
        await this.vonageWebhookService.processSandboxInboundMessage(webhookData as SandboxInboundMessageWebhookDto);
      }
      res.sendStatus(200);
    } catch (error) {
      this.logger.error('Error processing inbound message webhook:', error);
      res.sendStatus(200); // Always return 200 to prevent webhook retries
    }
  }

  /**
   * Handle status webhook from Vonage
   * Supports both production and sandbox environments
   */
  @Post('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Handle status webhook',
    description: 'Processes message status updates from Vonage webhook. Supports both production and sandbox environments.'
  })
  @ApiBody({ 
    description: 'Status webhook payload from Vonage (production or sandbox format)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully' 
  })
  async handleStatus(
    @Body() webhookData: StatusWebhookDto | SandboxStatusWebhookDto,
    @Res() res: Response
  ): Promise<void> {
    const isProduction = process.env.NODE_ENV === 'production';
    const messageUuid = webhookData.message_uuid;
    const status = webhookData.status;
    
    this.logger.log(`Received status webhook (${isProduction ? 'production' : 'sandbox'}): ${messageUuid} - ${status}`);
    
    try {
      if (isProduction) {
        await this.vonageWebhookService.processStatusUpdate(webhookData as StatusWebhookDto);
      } else {
        await this.vonageWebhookService.processSandboxStatusUpdate(webhookData as SandboxStatusWebhookDto);
      }
      res.sendStatus(200);
    } catch (error) {
      this.logger.error('Error processing status webhook:', error);
      res.sendStatus(200); // Always return 200 to prevent webhook retries
    }
  }
}
