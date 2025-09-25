import { 
  Controller, 
  Post, 
  Get,
  Body, 
  Query,
  ValidationPipe, 
  UsePipes,
  HttpStatus,
  HttpCode,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto, SendMessageResponseDto } from './dto/send-message.dto';
import { WhatsAppMessageExamples } from './dto/whatsapp-examples';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { QueueService } from '../customer-queue/queue.service';
import { QueueStatus } from '../customer-queue/entities/queue.entity';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true }))
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Send a message to a customer
   */
  @Post('sendMessage')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send a message to a customer',
    description: 'Send a message from the authenticated user to a customer on the specified platform. The user information is automatically extracted from the JWT token. Supports all WhatsApp message types including text, images, videos, audio, documents, locations, contacts, and stickers.',
  })
  @ApiBody({
    description: 'Message data with platform-specific information',
    examples: {
      textMessage: {
        summary: 'Text Message',
        description: 'Send a simple text message',
        value: WhatsAppMessageExamples.text
      },
      imageMessage: {
        summary: 'Image Message',
        description: 'Send an image with optional caption',
        value: WhatsAppMessageExamples.image
      },
      videoMessage: {
        summary: 'Video Message',
        description: 'Send a video with optional caption',
        value: WhatsAppMessageExamples.video
      },
      audioMessage: {
        summary: 'Audio Message',
        description: 'Send an audio file',
        value: WhatsAppMessageExamples.audio
      },
      documentMessage: {
        summary: 'Document Message',
        description: 'Send a document (PDF, DOC, etc.) with optional caption',
        value: WhatsAppMessageExamples.document
      },
      locationMessage: {
        summary: 'Location Message',
        description: 'Send a location with coordinates and address',
        value: WhatsAppMessageExamples.location
      },
      contactMessage: {
        summary: 'Contact Message',
        description: 'Send contact information',
        value: WhatsAppMessageExamples.contact
      },
      stickerMessage: {
        summary: 'Sticker Message',
        description: 'Send a sticker',
        value: WhatsAppMessageExamples.sticker
      },
      replyMessage: {
        summary: 'Reply Message',
        description: 'Reply to an existing message',
        value: WhatsAppMessageExamples.reply
      },
      groupMessage: {
        summary: 'Group Message',
        description: 'Send a message to a WhatsApp group',
        value: WhatsAppMessageExamples.group
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Message sent successfully',
    type: SendMessageResponseDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      messageId: 'whatsapp_123456789_abc123',
      sessionId: 'session_whatsapp_123456789',
      senderType: 'user',
      recipientType: 'customer',
      customerId: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      fromMe: true,
      system: false,
      isGroup: false,
      message: 'Hello! Thank you for contacting us.',
      type: 'text',
      platform: 'whatsapp',
      status: 'sent',
      metadata: null,
      sentAt: '2024-01-01T10:00:00.000Z',
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-01-01T10:00:00.000Z'
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data or missing required fields',
    example: {
      statusCode: 400,
      message: 'Either message text or media must be provided',
      error: 'Bad Request'
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized'
    }
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    example: {
      statusCode: 500,
      message: 'Platform service error for whatsapp: Evolution API connection failed',
      error: 'Internal Server Error'
    }
  })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @CurrentUser() user: User,
  ): Promise<SendMessageResponseDto> {
    return await this.chatService.sendMessage(sendMessageDto, user);
  }

  /**
   * Get chat history for a specific session
   */
  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get chat history for a session',
    description: 'Retrieve the chat history for a specific session from Redis storage.',
  })
  @ApiQuery({
    name: 'sessionId',
    description: 'Session ID to retrieve chat history for',
    example: 'session_123456789',
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of messages to retrieve',
    example: 50,
    required: false,
    default: 50,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          example: 'session_123456789',
        },
        messages: {
          type: 'array',
          items: {
            type: 'object',
            description: 'Message object with all message properties',
          },
        },
        count: {
          type: 'number',
          example: 25,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid session ID or query parameters',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  async getChatHistory(
    @Query('sessionId') sessionId: string,
    @Query('limit') limit?: string,
  ): Promise<{
    sessionId: string;
    messages: any[];
    count: number;
  }> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const limitNumber = limit ? parseInt(limit) : 50;
    const messages = await this.chatService.getChatHistory(sessionId, limitNumber);

    return {
      sessionId,
      messages,
      count: messages.length,
    };
  }

  /**
   * Get session statistics
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get session statistics',
    description: 'Retrieve statistics about messages for a specific session including counts from both Redis and PostgreSQL.',
  })
  @ApiQuery({
    name: 'sessionId',
    description: 'Session ID to get statistics for',
    example: 'session_123456789',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          example: 'session_123456789',
        },
        redisCount: {
          type: 'number',
          example: 25,
        },
        postgresCount: {
          type: 'number',
          example: 100,
        },
        lastMessageAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T10:00:00.000Z',
        },
        firstMessageAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T09:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid session ID',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  async getSessionStatistics(@Query('sessionId') sessionId: string): Promise<{
    sessionId: string;
    redisCount: number;
    postgresCount: number;
    lastMessageAt?: string;
    firstMessageAt?: string;
  }> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const statistics = await this.chatService.getSessionStatistics(sessionId);
    
    return {
      sessionId,
      ...statistics,
    };
  }

  /**
   * Get customer data from queue by session ID
   */
  @Get('customer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get customer data from queue',
    description: 'Retrieve customer information and queue status for a specific session ID. This includes customer details, queue status, and metadata.',
  })
  @ApiQuery({
    name: 'sessionId',
    description: 'Session ID to get customer data for',
    example: 'session_whatsapp_123456789',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          example: 'session_whatsapp_123456789',
        },
        customerId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        customer: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            platformId: { type: 'string', example: '5511999999999@s.whatsapp.net' },
            pushName: { type: 'string', example: 'João Silva' },
            name: { type: 'string', example: 'João Silva' },
            profilePicUrl: { type: 'string', example: 'https://example.com/profile-pics/joao.jpg' },
            contact: { type: 'string', example: '+5511999999999' },
            email: { type: 'string', example: 'joao.silva@email.com' },
            priority: { type: 'number', example: 5 },
            isGroup: { type: 'boolean', example: false },
            type: { type: 'string', example: 'contact' },
            status: { type: 'string', example: 'active' },
            platform: { type: 'string', example: 'whatsapp' },
            observations: { type: 'string', example: 'VIP customer' },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'tag_123' },
                  tag: { type: 'string', example: 'VIP' },
                  normalizedTag: { type: 'string', example: 'vip' },
                  isSystemTag: { type: 'boolean', example: true },
                  isUserTag: { type: 'boolean', example: false }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T10:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-01-01T10:00:00.000Z' }
          }
        },
        userId: {
          type: 'string',
          example: 'user_123e4567-e89b-12d3-a456-426614174000',
        },
        platform: {
          type: 'string',
          example: 'whatsapp',
        },
        status: {
          type: 'string',
          enum: ['bot', 'waiting', 'service'],
          example: 'service',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T10:00:00.000Z',
        },
        attendedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T10:05:00.000Z',
        },
        lastMessage: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'msg_123' },
            messageId: { type: 'string', example: 'whatsapp_123456789_abc123' },
            message: { type: 'string', example: 'Hello, I need help with my order' },
            type: { type: 'string', example: 'text' },
            fromMe: { type: 'boolean', example: false },
            sentAt: { type: 'string', format: 'date-time', example: '2024-01-01T10:00:00.000Z' }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            instance: { type: 'string', example: 'default' },
            number: { type: 'string', example: '+5511999999999' },
            customerName: { type: 'string', example: 'João Silva' },
            customerPhone: { type: 'string', example: '+5511999999999' },
            queuePosition: { type: 'number', example: 1 },
            waitingTime: { type: 'number', example: 300000 }
          }
        }
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found in queue',
    example: {
      statusCode: 404,
      message: 'Queue item not found',
      error: 'Not Found'
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid session ID',
    example: {
      statusCode: 400,
      message: 'Session ID is required',
      error: 'Bad Request'
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized'
    }
  })
  async getCustomerData(@Query('sessionId') sessionId: string): Promise<any> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    return await this.chatService.getCustomerDataFromQueue(sessionId);
  }

  /**
   * List all queues assigned to the current user
   */
  @Get('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all queues assigned to current user',
    description: 'Retrieve all queue items assigned to the authenticated user. Supports filtering by queue status.',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    example: 20,
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by queue status',
    enum: QueueStatus,
    example: QueueStatus.SERVICE,
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User queues retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string', example: 'session_whatsapp_123456789' },
              customerId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
              customer: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                  name: { type: 'string', example: 'João Silva' },
                  contact: { type: 'string', example: '+5511999999999' },
                  platform: { type: 'string', example: 'whatsapp' },
                  priority: { type: 'number', example: 5 },
                  isGroup: { type: 'boolean', example: false },
                  status: { type: 'string', example: 'active' }
                }
              },
              userId: { type: 'string', example: 'user_123e4567-e89b-12d3-a456-426614174000' },
              platform: { type: 'string', example: 'whatsapp' },
              status: { type: 'string', example: 'service' },
              createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T10:00:00.000Z' },
              attendedAt: { type: 'string', format: 'date-time', example: '2024-01-01T10:05:00.000Z' },
              lastMessage: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'msg_123' },
                  message: { type: 'string', example: 'Hello, I need help with my order' },
                  type: { type: 'string', example: 'text' },
                  fromMe: { type: 'boolean', example: false },
                  sentAt: { type: 'string', format: 'date-time', example: '2024-01-01T10:00:00.000Z' }
                }
              },
              metadata: { type: 'object', nullable: true },
              isBot: { type: 'boolean', example: false },
              isWaiting: { type: 'boolean', example: false },
              isInService: { type: 'boolean', example: true },
              isAttended: { type: 'boolean', example: true },
              waitingTime: { type: 'number', example: 300000 }
            }
          }
        },
        total: { type: 'number', example: 5 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 1 },
        userId: { type: 'string', example: 'user_123e4567-e89b-12d3-a456-426614174000' },
        userName: { type: 'string', example: 'John Doe' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized'
    }
  })
  async listUserQueues(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: QueueStatus,
    @CurrentUser() user?: User,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    userId: string;
    userName: string;
  }> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const query = {
      userId: user.id,
      page: page || '1',
      limit: limit || '20',
      ...(status && { status }),
    };

    const result = await this.queueService.findAllQueue(query);
    
    return {
      ...result,
      userId: user.id,
      userName: user.name || user.login,
    };
  }
}
