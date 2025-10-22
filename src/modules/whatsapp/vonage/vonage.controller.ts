import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { VonageService } from './vonage.service';
import { SendMessageDto } from './dto/vonage.dto';
import { VonageSendMessageResponse } from './interfaces/vonage.interface';

/**
 * Send Template Message DTO
 */
export class SendTemplateMessageDto {
  toNumber: string;
  template_name: string;
  template_namespace: string;
  parameters?: string[];
  components?: any[];
}

/**
 * Vonage WhatsApp Business API Controller
 * Handles message sending operations
 */
@ApiTags('Vonage')
@Controller('vonage')
export class VonageController {
  private readonly logger = new Logger(VonageController.name);

  constructor(private readonly vonageService: VonageService) {}

  /**
   * Send a message via Vonage WhatsApp Business API
   */
  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send WhatsApp message via Vonage',
    description: 'Sends a WhatsApp message using Vonage Communications API. Supports text, image, and button messages.'
  })
  @ApiBody({ 
    type: SendMessageDto,
    description: 'Message details including recipient, type, and content'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Message sent successfully',
    schema: {
      type: 'object',
      properties: {
        message_uuid: { type: 'string', description: 'Unique message identifier' },
        to: { type: 'string', description: 'Recipient phone number' },
        from: { type: 'string', description: 'Sender phone number' },
        timestamp: { type: 'string', description: 'Message timestamp' },
        direction: { type: 'string', description: 'Message direction' },
        message_type: { type: 'string', description: 'Type of message sent' },
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid message data' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error - failed to send message' 
  })
  async sendMessage(@Body() sendMessageDto: SendMessageDto): Promise<VonageSendMessageResponse> {
    this.logger.log(`Received send message request for ${sendMessageDto.toNumber}`);
    
    try {
      const result = await this.vonageService.sendMessage(sendMessageDto);
      this.logger.log(`Message sent successfully to ${sendMessageDto.toNumber}. UUID: ${result.message_uuid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send message to ${sendMessageDto.toNumber}:`, error);
      throw error;
    }
  }

  /**
   * Send a template message via Vonage WhatsApp Business API
   */
  @Post('send-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send WhatsApp template message via Vonage',
    description: 'Sends a WhatsApp template message using Vonage Communications API. Supports MTM, custom templates, and business templates.'
  })
  @ApiBody({ 
    type: SendTemplateMessageDto,
    description: 'Template message details including recipient, template name, namespace, and parameters'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Template message sent successfully',
    schema: {
      type: 'object',
      properties: {
        message_uuid: { type: 'string', description: 'Unique message identifier' },
        to: { type: 'string', description: 'Recipient phone number' },
        from: { type: 'string', description: 'Sender phone number' },
        timestamp: { type: 'string', description: 'Message timestamp' },
        direction: { type: 'string', description: 'Message direction' },
        message_type: { type: 'string', description: 'Type of message sent' },
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid template data' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error - failed to send template message' 
  })
  async sendTemplateMessage(@Body() templateDto: SendTemplateMessageDto): Promise<VonageSendMessageResponse> {
    this.logger.log(`Received send template message request for ${templateDto.toNumber}`);
    
    try {
      // Convert template DTO to regular SendMessageDto
      const sendMessageDto: SendMessageDto = {
        toNumber: templateDto.toNumber,
        type: 'template_custom',
        template_name: templateDto.template_name,
        template_namespace: templateDto.template_namespace,
        parameters: templateDto.parameters,
        components: templateDto.components,
      };

      const result = await this.vonageService.sendMessage(sendMessageDto);
      this.logger.log(`Template message sent successfully to ${templateDto.toNumber}. UUID: ${result.message_uuid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send template message to ${templateDto.toNumber}:`, error);
      throw error;
    }
  }
}
