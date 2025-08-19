import { Controller, Post, Get, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { EvolutionWebhookDto } from './dto/webhook.dto';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('evolution')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Evolution API webhook messages' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleEvolutionWebhook(@Body() webhookData: any) {
    this.logger.log(`Received Evolution webhook: ${webhookData?.event} for instance ${webhookData?.instance}`);
    this.logger.debug('Webhook data:', JSON.stringify(webhookData, null, 2));
    
    try {
      const result = await this.webhookService.processEvolutionMessage(webhookData);
      return { success: true, message: 'Webhook processed successfully', data: result };
    } catch (error) {
      this.logger.error(`Error processing Evolution webhook: ${error.message}`, error.stack);
      // Return 200 even on error to prevent Evolution API from retrying
      return { success: false, message: 'Webhook processed with errors', error: error.message };
    }
  }

  @Post('evolution/health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook health check endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook endpoint is healthy' })
  async healthCheck() {
    return { 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'Evolution Webhook Handler'
    };
  }

  @Get('evolution/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook endpoint is accessible' })
  async testEndpoint() {
    return { 
      status: 'accessible', 
      timestamp: new Date().toISOString(),
      url: 'https://vm103-8082.ubicuacloud.com.br/webhook/evolution',
      message: 'Webhook endpoint is ready to receive Evolution API calls'
    };
  }
} 