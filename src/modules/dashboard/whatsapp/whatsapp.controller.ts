import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { WhatsAppStatsDto } from './dto/whatsapp-stats.dto';
import { GetMessagesDto } from './dto/get-messages.dto';

/**
 * Controller for handling WhatsApp dashboard operations
 */
@Controller('dashboard/whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  /**
   * Get WhatsApp statistics
   */
  @Get('stats')
  async getWhatsAppStats(): Promise<WhatsAppStatsDto> {
    return this.whatsappService.getWhatsAppStats();
  }

  /**
   * Get messages with optional filtering
   */
  @Get('messages')
  async getMessages(@Query() query: GetMessagesDto): Promise<any> {
    return this.whatsappService.getMessages(query);
  }

  /**
   * Send a message via WhatsApp
   */
  @Post('send')
  async sendMessage(@Body() sendMessageDto: SendMessageDto): Promise<any> {
    return this.whatsappService.sendMessage(sendMessageDto);
  }

  /**
   * Get message status by ID
   */
  @Get('messages/:messageId/status')
  async getMessageStatus(@Param('messageId') messageId: string): Promise<any> {
    return this.whatsappService.getMessageStatus(messageId);
  }

  /**
   * Get connected WhatsApp accounts
   */
  @Get('accounts')
  async getConnectedAccounts(): Promise<any> {
    return this.whatsappService.getConnectedAccounts();
  }
}
