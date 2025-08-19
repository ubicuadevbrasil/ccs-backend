import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import {
  GetMessagesBySessionDto,
  GetMessagesByGroupDto,
  MessageResponseDto,
} from './dto/messages.dto';
import { Message } from './interfaces/message.interface';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Fetch messages from a queue session',
    description: 'Retrieves all messages associated with a specific queue session. Messages are ordered by sent time (oldest first).'
  })
  @ApiQuery({ 
    name: 'sessionId', 
    required: true, 
    description: 'Session ID to fetch messages for',
    example: 'session-123'
  })
  @ApiQuery({ 
    name: 'messageType', 
    required: false, 
    description: 'Filter by message type',
    enum: ['conversation', 'imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'contactMessage', 'locationMessage', 'reactionMessage']
  })
  @ApiQuery({ 
    name: 'from', 
    required: false, 
    description: 'Filter by message source',
    enum: ['Customer', 'Operator', 'Typebot', 'System']
  })
  @ApiQuery({ 
    name: 'direction', 
    required: false, 
    description: 'Filter by message direction',
    enum: ['inbound', 'outbound']
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    description: 'Start date filter (ISO string)',
    example: '2024-01-01T00:00:00Z'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    description: 'End date filter (ISO string)',
    example: '2024-12-31T23:59:59Z'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Messages retrieved successfully',
    type: [MessageResponseDto],
    schema: {
      example: [
        {
          id: 'msg-123',
          sessionId: 'session-456',
          evolutionMessageId: 'evol-789',
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false,
          instance: 'instance-1',
          pushName: 'John Doe',
          source: 'android',
          messageTimestamp: 1703123456789,
          messageType: 'conversation',
          from: 'Customer',
          direction: 'inbound',
          content: 'Hello, I need help with my account',
          mediaUrl: null,
          mimetype: null,
          caption: null,
          fileName: null,
          fileLength: null,
          fileSha256: null,
          width: null,
          height: null,
          seconds: null,
          isAnimated: null,
          ptt: null,
          pageCount: null,
          latitude: null,
          longitude: null,
          locationName: null,
          locationAddress: null,
          contactDisplayName: null,
          contactVcard: null,
          reactionText: null,
          reactionToMessageId: null,
          senderId: 'customer-123',
          senderName: 'John Doe',
          senderPhone: '5511999999999',
          typebotMessageId: null,
          evolutionData: {},
          metadata: {},
          status: 'sent',
          sentAt: '2024-01-15T10:30:00Z',
          deliveredAt: '2024-01-15T10:30:05Z',
          readAt: '2024-01-15T10:31:00Z',
          createdAt: '2024-01-15T10:30:00Z'
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid session ID or filter parameters' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  async getMessagesBySession(@Query() query: GetMessagesBySessionDto): Promise<Message[]> {
    if (!query.sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    const filters: any = {
      sessionId: query.sessionId,
    };

    if (query.messageType) {
      filters.messageType = query.messageType;
    }

    if (query.from) {
      filters.from = query.from;
    }

    if (query.direction) {
      filters.direction = query.direction;
    }

    if (query.startDate) {
      filters.startDate = new Date(query.startDate);
    }

    if (query.endDate) {
      filters.endDate = new Date(query.endDate);
    }

    return this.messagesService.findMessages(filters);
  }

  @Get('group')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Fetch messages from a group',
    description: 'Retrieves all messages associated with a specific WhatsApp group. Messages are ordered by sent time (oldest first).'
  })
  @ApiQuery({ 
    name: 'groupId', 
    required: true, 
    description: 'Group ID to fetch messages for',
    example: '120363401241665225@g.us'
  })
  @ApiQuery({ 
    name: 'messageType', 
    required: false, 
    description: 'Filter by message type',
    enum: ['conversation', 'imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'contactMessage', 'locationMessage', 'reactionMessage']
  })
  @ApiQuery({ 
    name: 'from', 
    required: false, 
    description: 'Filter by message source',
    enum: ['Customer', 'Operator', 'Typebot', 'System']
  })
  @ApiQuery({ 
    name: 'direction', 
    required: false, 
    description: 'Filter by message direction',
    enum: ['inbound', 'outbound']
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    description: 'Start date filter (ISO string)',
    example: '2024-01-01T00:00:00Z'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    description: 'End date filter (ISO string)',
    example: '2024-12-31T23:59:59Z'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Messages retrieved successfully',
    type: [MessageResponseDto],
    schema: {
      example: [
        {
          id: 'msg-456',
          sessionId: 'session-789',
          evolutionMessageId: 'evol-101',
          remoteJid: '120363401241665225@g.us',
          fromMe: false,
          instance: 'instance-1',
          pushName: 'Jane Smith',
          source: 'ios',
          messageTimestamp: 1703123456789,
          messageType: 'conversation',
          from: 'Customer',
          direction: 'inbound',
          content: 'Hello everyone!',
          mediaUrl: null,
          mimetype: null,
          caption: null,
          fileName: null,
          fileLength: null,
          fileSha256: null,
          width: null,
          height: null,
          seconds: null,
          isAnimated: null,
          ptt: null,
          pageCount: null,
          latitude: null,
          longitude: null,
          locationName: null,
          locationAddress: null,
          contactDisplayName: null,
          contactVcard: null,
          reactionText: null,
          reactionToMessageId: null,
          senderId: 'customer-456',
          senderName: 'Jane Smith',
          senderPhone: '5511888888888',
          typebotMessageId: null,
          evolutionData: {},
          metadata: {},
          status: 'sent',
          sentAt: '2024-01-15T10:30:00Z',
          deliveredAt: '2024-01-15T10:30:05Z',
          readAt: '2024-01-15T10:31:00Z',
          createdAt: '2024-01-15T10:30:00Z'
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid group ID or filter parameters' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Group not found' 
  })
  async getMessagesByGroup(@Query() query: GetMessagesByGroupDto): Promise<Message[]> {
    if (!query.groupId) {
      throw new BadRequestException('Group ID is required');
    }

    // Validate that the groupId is a valid group JID
    if (!query.groupId.includes('@g.us')) {
      throw new BadRequestException('Invalid group ID format. Must be a valid WhatsApp group JID (e.g., 120363401241665225@g.us)');
    }

    const filters: any = {
      remoteJid: query.groupId,
    };

    if (query.messageType) {
      filters.messageType = query.messageType;
    }

    if (query.from) {
      filters.from = query.from;
    }

    if (query.direction) {
      filters.direction = query.direction;
    }

    if (query.startDate) {
      filters.startDate = new Date(query.startDate);
    }

    if (query.endDate) {
      filters.endDate = new Date(query.endDate);
    }

    return this.messagesService.findMessages(filters);
  }
} 