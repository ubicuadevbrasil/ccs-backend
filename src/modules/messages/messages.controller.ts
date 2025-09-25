import { 
  Controller, 
  Get, 
  Query, 
  ValidationPipe, 
  UsePipes,
  HttpStatus,
  HttpCode,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { MessageStorageService } from './message-storage.service';
import { MessageQueryDto, MessageResponseDto, PaginatedMessagesResponseDto, SessionMessagesResponseDto } from './dto/message.dto';
import { SessionMessagesQueryDto } from './dto/message.dto';
import { Message } from './entities/message.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true }))
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messageStorageService: MessageStorageService,
  ) {}

  /**
   * Get messages for a specific session from Redis
   */
  @Get('session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get session messages from Redis',
    description: 'Retrieve messages for a specific session from Redis storage. This endpoint provides fast access to recent messages stored in Redis.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session messages retrieved successfully',
    type: SessionMessagesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid session ID or query parameters',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found or no messages available',
  })
  async getSessionMessages(@Query() query: SessionMessagesQueryDto): Promise<{
    sessionId: string;
    messages: any[];
    count: number;
    source: string;
  }> {
    const { sessionId, limit = '50', source = 'redis' } = query;
    const limitNumber = parseInt(limit);

    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    if (source === 'redis') {
      // Get messages from Redis
      const messages = await this.messageStorageService.getSessionMessages(sessionId, limitNumber);
      
      return {
        sessionId,
        messages,
        count: messages.length,
        source: 'redis',
      };
    } else {
      // Get messages from PostgreSQL
      const result = await this.messageStorageService.getSessionMessagesFromPostgreSQL(
        sessionId,
        limitNumber,
        1
      );
      
      return {
        sessionId,
        messages: result.data,
        count: result.total,
        source: 'postgres',
      };
    }
  }

  /**
   * Get session statistics
   */
  @Get('session/statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get session message statistics',
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

    const statistics = await this.messageStorageService.getSessionStatistics(sessionId);
    
    return {
      sessionId,
      ...statistics,
    };
  }

  /**
   * Get all messages with filtering and pagination
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get messages with filtering and pagination',
    description: 'Retrieve messages from PostgreSQL with various filters and pagination options.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages retrieved successfully',
    type: PaginatedMessagesResponseDto,
  })
  async getMessages(@Query() query: MessageQueryDto): Promise<{
    data: Message[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.messagesService.listMessages(query);
  }

  /**
   * Get active sessions
   */
  @Get('sessions/active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active sessions',
    description: 'Retrieve list of all active sessions that have messages in Redis.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active sessions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        sessions: {
          type: 'array',
          items: {
            type: 'string',
            example: 'session_123456789',
          },
        },
        count: {
          type: 'number',
          example: 5,
        },
      },
    },
  })
  async getActiveSessions(): Promise<{
    sessions: string[];
    count: number;
  }> {
    const sessions = await this.messageStorageService.getActiveSessions();
    
    return {
      sessions,
      count: sessions.length,
    };
  }
}
