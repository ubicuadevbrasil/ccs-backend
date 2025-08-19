import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { MessagesService } from '../messages/messages.service';
import {
  SendTextDto,
  SendMediaDto,
  SendAudioDto,
  SendLocationDto,
  SendContactDto,
  SendReactionDto,
  SendStickerDto,
  SendStatusDto,
  CheckWhatsAppNumbersDto,
  MarkMessagesAsReadDto,
  ArchiveChatDto,
  MarkChatUnreadDto,
  DeleteMessageDto,
  FetchProfilePictureDto,
  GetBase64FromMediaMessageDto,
  UpdateMessageDto,
  SendPresenceDto,
  UpdateBlockStatusDto,
  FindContactsDto,
  FindMessagesDto,
  FindStatusMessageDto,
  FindChatsDto,
  FetchBusinessProfileDto,
  FetchProfileDto,
  UpdateProfileNameDto,
  UpdateProfileStatusDto,
  UpdateProfilePictureDto,
  UpdatePrivacySettingsDto,
  FindLabelsDto,
  HandleLabelDto,
  FakeCallDto,
  SendTemplateDto,
  GetMediaDto,
  GetMediaUrlDto,
} from './dto/chat.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly messagesService: MessagesService
  ) {}

  // Message Sending Endpoints
  @Post('send-text')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send text message to WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Text message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: SendTextDto })
  async sendText(@Body() data: SendTextDto, @Request() req) {
    this.logger.log(`POST /chat/send-text - Sending text to ${data.number}`);
    
    // Get operator data from JWT token
    const operatorData = {
      id: req.user.id,
      name: req.user.name,
      login: req.user.login,
      email: req.user.email,
      profile: req.user.profile,
      department: req.user.department
    };
    
    return await this.chatService.sendText(data, operatorData);
  }

  @Post('send-media')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send media message (image, video, document) to WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Media message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: SendMediaDto })
  async sendMedia(@Body() data: SendMediaDto, @Request() req) {
    this.logger.log(`POST /chat/send-media - Sending media to ${data.number}`);
    
    // Get operator data from JWT token
    const operatorData = {
      id: req.user.id,
      name: req.user.name,
      login: req.user.login,
      email: req.user.email,
      profile: req.user.profile,
      department: req.user.department
    };
    
    return await this.chatService.sendMedia(data, operatorData);
  }

  @Post('send-audio')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send audio message to WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Audio message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: SendAudioDto })
  async sendAudio(@Body() data: SendAudioDto, @Request() req) {
    this.logger.log(`POST /chat/send-audio - Sending audio to ${data.number}`);
    
    // Get operator data from JWT token
    const operatorData = {
      id: req.user.id,
      name: req.user.name,
      login: req.user.login,
      email: req.user.email,
      profile: req.user.profile,
      department: req.user.department
    };
    
    return await this.chatService.sendAudio(data, operatorData);
  }

  @Post('send-location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send location message to WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Location message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: SendLocationDto })
  async sendLocation(@Body() data: SendLocationDto, @Request() req) {
    this.logger.log(`POST /chat/send-location - Sending location to ${data.number}`);
    
    // Get operator data from JWT token
    const operatorData = {
      id: req.user.id,
      name: req.user.name,
      login: req.user.login,
      email: req.user.email,
      profile: req.user.profile,
      department: req.user.department
    };
    
    return await this.chatService.sendLocation(data, operatorData);
  }

  @Post('send-contact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send contact information to WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Contact message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: SendContactDto })
  async sendContact(@Body() data: SendContactDto, @Request() req) {
    this.logger.log(`POST /chat/send-contact - Sending contact to ${data.number}`);
    
    // Get operator data from JWT token
    const operatorData = {
      id: req.user.id,
      name: req.user.name,
      login: req.user.login,
      email: req.user.email,
      profile: req.user.profile,
      department: req.user.department
    };
    
    return await this.chatService.sendContact(data, operatorData);
  }

  @Post('send-reaction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send reaction to a WhatsApp message' })
  @ApiResponse({ status: 200, description: 'Reaction sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: SendReactionDto })
  async sendReaction(@Body() data: SendReactionDto) {
    this.logger.log(`POST /chat/send-reaction - Sending reaction`);
    return await this.chatService.sendReaction(data);
  }

  @Post('send-sticker')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send sticker to WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Sticker sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: SendStickerDto })
  async sendSticker(@Body() data: SendStickerDto, @Request() req) {
    this.logger.log(`POST /chat/send-sticker - Sending sticker to ${data.number}`);
    
    // Get operator data from JWT token
    const operatorData = {
      id: req.user.id,
      name: req.user.name,
      login: req.user.login,
      email: req.user.email,
      profile: req.user.profile,
      department: req.user.department
    };
    
    return await this.chatService.sendSticker(data, operatorData);
  }

  @Post('send-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send status message to WhatsApp' })
  @ApiResponse({ status: 200, description: 'Status message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: SendStatusDto })
  async sendStatus(@Body() data: SendStatusDto) {
    this.logger.log(`POST /chat/send-status - Sending status message`);
    return await this.chatService.sendStatus(data);
  }

  @Post('send-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send template message to WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Template message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: SendTemplateDto })
  async sendTemplate(@Body() data: SendTemplateDto, @Request() req) {
    this.logger.log(`POST /chat/send-template - Sending template to ${data.number}`);
    
    // Get operator data from JWT token
    const operatorData = {
      id: req.user.id,
      name: req.user.name,
      login: req.user.login,
      email: req.user.email,
      profile: req.user.profile,
      department: req.user.department
    };
    
    return await this.chatService.sendTemplate(data, operatorData);
  }

  // Chat Management Endpoints
  @Post('check-whatsapp-numbers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if phone numbers are registered on WhatsApp' })
  @ApiResponse({ status: 200, description: 'WhatsApp numbers checked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: CheckWhatsAppNumbersDto })
  async checkWhatsAppNumbers(@Body() data: CheckWhatsAppNumbersDto) {
    this.logger.log(`POST /chat/check-whatsapp-numbers - Checking numbers`);
    return await this.chatService.checkWhatsAppNumbers(data);
  }

  @Post('mark-messages-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read in WhatsApp chat' })
  @ApiResponse({ status: 200, description: 'Messages marked as read successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: MarkMessagesAsReadDto })
  async markMessagesAsRead(@Body() data: MarkMessagesAsReadDto) {
    this.logger.log(`POST /chat/mark-messages-read - Marking messages as read`);
    return await this.chatService.markMessagesAsRead(data);
  }

  @Post('archive-chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive or unarchive a WhatsApp chat' })
  @ApiResponse({ status: 200, description: 'Chat archived/unarchived successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: ArchiveChatDto })
  async archiveChat(@Body() data: ArchiveChatDto) {
    this.logger.log(`POST /chat/archive-chat - Archiving chat`);
    return await this.chatService.archiveChat(data);
  }

  @Post('mark-chat-unread')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a WhatsApp chat as unread' })
  @ApiResponse({ status: 200, description: 'Chat marked as unread successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: MarkChatUnreadDto })
  async markChatUnread(@Body() data: MarkChatUnreadDto) {
    this.logger.log(`POST /chat/mark-chat-unread - Marking chat as unread`);
    return await this.chatService.markChatUnread(data);
  }

  @Delete('delete-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a message for everyone in WhatsApp chat' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: DeleteMessageDto })
  async deleteMessage(@Body() data: DeleteMessageDto) {
    this.logger.log(`DELETE /chat/delete-message - Deleting message`);
    return await this.chatService.deleteMessage(data);
  }

  @Post('fetch-profile-picture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch profile picture URL for a WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Profile picture fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: FetchProfilePictureDto })
  async fetchProfilePicture(@Body() data: FetchProfilePictureDto) {
    this.logger.log(`POST /chat/fetch-profile-picture - Fetching profile picture for ${data.number}`);
    return await this.chatService.fetchProfilePicture(data);
  }

  @Post('get-base64-media')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get base64 data from a media message' })
  @ApiResponse({ status: 200, description: 'Base64 media data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: GetBase64FromMediaMessageDto })
  async getBase64FromMediaMessage(@Body() data: GetBase64FromMediaMessageDto) {
    this.logger.log(`POST /chat/get-base64-media - Getting base64 from media message`);
    return await this.chatService.getBase64FromMediaMessage(data);
  }

  @Put('update-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update/edit a WhatsApp message' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: UpdateMessageDto })
  async updateMessage(@Body() data: UpdateMessageDto) {
    this.logger.log(`PUT /chat/update-message - Updating message`);
    return await this.chatService.updateMessage(data);
  }

  @Post('send-presence')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send presence status (composing, recording, paused) to WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Presence sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: SendPresenceDto })
  async sendPresence(@Body() data: SendPresenceDto) {
    this.logger.log(`POST /chat/send-presence - Sending presence to ${data.number}`);
    return await this.chatService.sendPresence(data);
  }

  @Post('update-block-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block or unblock a WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Block status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: UpdateBlockStatusDto })
  async updateBlockStatus(@Body() data: UpdateBlockStatusDto) {
    this.logger.log(`POST /chat/update-block-status - Updating block status for ${data.number}`);
    return await this.chatService.updateBlockStatus(data);
  }

  @Post('find-contacts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find contacts in WhatsApp' })
  @ApiResponse({ status: 200, description: 'Contacts found successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: FindContactsDto })
  async findContacts(@Body() data: FindContactsDto) {
    this.logger.log(`POST /chat/find-contacts - Finding contacts`);
    return await this.chatService.findContacts(data);
  }

  @Post('find-messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find messages in WhatsApp chat' })
  @ApiResponse({ status: 200, description: 'Messages found successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: FindMessagesDto })
  async findMessages(@Body() data: FindMessagesDto) {
    this.logger.log(`POST /chat/find-messages - Finding messages`);
    return await this.chatService.findMessages(data);
  }

  @Post('find-status-messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find status messages in WhatsApp' })
  @ApiResponse({ status: 200, description: 'Status messages found successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: FindStatusMessageDto })
  async findStatusMessage(@Body() data: FindStatusMessageDto) {
    this.logger.log(`POST /chat/find-status-messages - Finding status messages`);
    return await this.chatService.findStatusMessage(data);
  }

  @Post('find-chats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find all chats in WhatsApp' })
  @ApiResponse({ status: 200, description: 'Chats found successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: FindChatsDto })
  async findChats(@Body() data: FindChatsDto) {
    this.logger.log(`POST /chat/find-chats - Finding chats`);
    return await this.chatService.findChats(data);
  }

  // Profile Management Endpoints
  @Post('fetch-business-profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch business profile information for a WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Business profile fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: FetchBusinessProfileDto })
  async fetchBusinessProfile(@Body() data: FetchBusinessProfileDto) {
    this.logger.log(`POST /chat/fetch-business-profile - Fetching business profile for ${data.number}`);
    return await this.chatService.fetchBusinessProfile(data);
  }

  @Post('fetch-profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch profile information for a WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Profile fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: FetchProfileDto })
  async fetchProfile(@Body() data: FetchProfileDto) {
    this.logger.log(`POST /chat/fetch-profile - Fetching profile for ${data.number}`);
    return await this.chatService.fetchProfile(data);
  }

  @Put('update-profile-name')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update WhatsApp profile name' })
  @ApiResponse({ status: 200, description: 'Profile name updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: UpdateProfileNameDto })
  async updateProfileName(@Body() data: UpdateProfileNameDto) {
    this.logger.log(`PUT /chat/update-profile-name - Updating profile name`);
    return await this.chatService.updateProfileName(data);
  }

  @Put('update-profile-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update WhatsApp profile status' })
  @ApiResponse({ status: 200, description: 'Profile status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: UpdateProfileStatusDto })
  async updateProfileStatus(@Body() data: UpdateProfileStatusDto) {
    this.logger.log(`PUT /chat/update-profile-status - Updating profile status`);
    return await this.chatService.updateProfileStatus(data);
  }

  @Put('update-profile-picture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update WhatsApp profile picture' })
  @ApiResponse({ status: 200, description: 'Profile picture updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: UpdateProfilePictureDto })
  async updateProfilePicture(@Body() data: UpdateProfilePictureDto) {
    this.logger.log(`PUT /chat/update-profile-picture - Updating profile picture`);
    return await this.chatService.updateProfilePicture(data);
  }

  @Delete('remove-profile-picture/:instance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove WhatsApp profile picture' })
  @ApiResponse({ status: 200, description: 'Profile picture removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  async removeProfilePicture(@Param('instance') instance: string) {
    this.logger.log(`DELETE /chat/remove-profile-picture/${instance} - Removing profile picture`);
    return await this.chatService.removeProfilePicture(instance);
  }

  @Get('fetch-privacy-settings/:instance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch WhatsApp privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  async fetchPrivacySettings(@Param('instance') instance: string) {
    this.logger.log(`GET /chat/fetch-privacy-settings/${instance} - Fetching privacy settings`);
    return await this.chatService.fetchPrivacySettings(instance);
  }

  @Put('update-privacy-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update WhatsApp privacy settings' })
  @ApiResponse({ status: 200, description: 'Privacy settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: UpdatePrivacySettingsDto })
  async updatePrivacySettings(@Body() data: UpdatePrivacySettingsDto) {
    this.logger.log(`PUT /chat/update-privacy-settings - Updating privacy settings`);
    return await this.chatService.updatePrivacySettings(data);
  }

  // Label Management Endpoints
  @Get('find-labels/:instance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find all labels in WhatsApp' })
  @ApiResponse({ status: 200, description: 'Labels found successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  async findLabels(@Param('instance') instance: string) {
    this.logger.log(`GET /chat/find-labels/${instance} - Finding labels`);
    return await this.chatService.findLabels({ instance });
  }

  @Post('handle-label')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add or remove label from a WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Label handled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: HandleLabelDto })
  async handleLabel(@Body() data: HandleLabelDto) {
    this.logger.log(`POST /chat/handle-label - Handling label for ${data.number}`);
    return await this.chatService.handleLabel(data);
  }

  // Call Management Endpoints
  @Post('fake-call')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make a fake call to a WhatsApp contact' })
  @ApiResponse({ status: 200, description: 'Fake call made successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: FakeCallDto })
  async fakeCall(@Body() data: FakeCallDto) {
    this.logger.log(`POST /chat/fake-call - Making fake call to ${data.number}`);
    return await this.chatService.fakeCall(data);
  }

  // Media Endpoints
  @Post('get-media')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get media from WhatsApp' })
  @ApiResponse({ status: 200, description: 'Media retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: GetMediaDto })
  async getMedia(@Body() data: GetMediaDto) {
    this.logger.log(`POST /chat/get-media - Getting media`);
    return await this.chatService.getMedia(data);
  }

  @Post('get-media-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get media URL from WhatsApp' })
  @ApiResponse({ status: 200, description: 'Media URL retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: GetMediaUrlDto })
  async getMediaUrl(@Body() data: GetMediaUrlDto) {
    this.logger.log(`POST /chat/get-media-url - Getting media URL`);
    return await this.chatService.getMediaUrl(data);
  }
} 