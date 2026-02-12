import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { OtimaWebhookService } from './otima-webhook.service';

@ApiTags('Otima Webhook')
@Controller('otima/webhook')
export class OtimaWebhookController {
  private readonly logger = new Logger(OtimaWebhookController.name);

  constructor(private readonly otimaWebhookService: OtimaWebhookService) {}

  @Post('messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle inbound WhatsApp messages from Otima',
    description:
      'Receives inbound WhatsApp messages from Otima broker and maps them into the internal message flow.',
  })
  @ApiBody({
    description: 'Inbound message array payload from Otima',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleMessages(@Body() body: any, @Res() res: Response): Promise<void> {
    try {
      console.log('body messages', new Date().toISOString(), JSON.stringify(body, null, 2));
      await this.otimaWebhookService.processInboundMessages(body);
      res.sendStatus(200);
    } catch (error) {
      this.logger.error('Error processing Otima inbound messages', error as Error);
      res.sendStatus(200);
    }
  }

  @Post('ack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle WhatsApp ACK/status updates from Otima',
    description: 'Receives message status updates from Otima broker.',
  })
  @ApiBody({
    description: 'Status update payload from Otima',
  })
  @ApiResponse({
    status: 200,
    description: 'Status webhook processed successfully',
  })
  async handleAck(@Body() body: any, @Res() res: Response): Promise<void> {
    try {
      console.log('body ack', body);
      await this.otimaWebhookService.processStatusUpdates(body);
      res.sendStatus(200);
    } catch (error) {
      this.logger.error('Error processing Otima ACK webhook', error as Error);
      res.sendStatus(200);
    }
  }
}


