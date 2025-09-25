import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QueueService, PaginatedResult } from './queue.service';
import {
  CreateQueueDto,
  UpdateQueueDto,
  QueueQueryDto,
  QueueResponseDto,
  FindQueueDto,
  EndServiceDto,
  TransferQueueDto,
} from './dto/queue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Customer Queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new queue item' })
  @ApiResponse({
    status: 201,
    description: 'Queue item created successfully',
    type: QueueResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Queue item with this sessionId already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data',
  })
  async createQueue(@Body() createQueueDto: CreateQueueDto): Promise<QueueResponseDto> {
    const queue = await this.queueService.createQueue(createQueueDto);
    return queue as QueueResponseDto;
  }

  @Get()
  @ApiOperation({ summary: 'Get all queue items with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for sessionId' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'platform', required: false, description: 'Filter by platform' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
  @ApiResponse({
    status: 200,
    description: 'Queue items retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/QueueResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAllQueue(@Query() query: QueueQueryDto): Promise<PaginatedResult<QueueResponseDto>> {
    const result = await this.queueService.findAllQueue(query);
    return {
      ...result,
      data: result.data as QueueResponseDto[],
    };
  }

  @Get('find')
  @ApiOperation({ summary: 'Find queue item by session ID' })
  @ApiQuery({ name: 'sessionId', required: true, description: 'Session ID to find' })
  @ApiResponse({
    status: 200,
    description: 'Queue item found successfully',
    type: QueueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Queue item not found',
  })
  async findQueueBySessionId(@Query() query: FindQueueDto): Promise<QueueResponseDto> {
    const queue = await this.queueService.findQueueBySessionId(query.sessionId);
    return queue as QueueResponseDto;
  }

  @Patch()
  @ApiOperation({ summary: 'Update queue item by session ID' })
  @ApiResponse({
    status: 200,
    description: 'Queue item updated successfully',
    type: QueueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Queue item not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data',
  })
  async updateQueue(@Body() updateQueueDto: UpdateQueueDto): Promise<QueueResponseDto> {
    const queue = await this.queueService.updateQueue(updateQueueDto.sessionId, updateQueueDto);
    return queue as QueueResponseDto;
  }

  @Delete()
  @ApiOperation({ summary: 'Delete queue item by session ID' })
  @ApiResponse({
    status: 204,
    description: 'Queue item deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Queue item not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQueue(@Query() query: FindQueueDto): Promise<void> {
    await this.queueService.deleteQueue(query.sessionId);
  }

  @Post('end-service')
  @ApiOperation({ summary: 'End service - create history record and delete from queue' })
  @ApiResponse({
    status: 200,
    description: 'Service ended successfully - history created and queue item deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Queue item not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data',
  })
  async endService(@Body() endServiceDto: EndServiceDto): Promise<{ message: string }> {
    await this.queueService.endService(endServiceDto);
    return { message: 'Service ended successfully' };
  }

  @Post('attend')
  @ApiOperation({ summary: 'Mark queue item as attended by authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Queue item marked as attended successfully',
    type: QueueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Queue item not found',
  })
  async markAsAttended(
    @Query() query: FindQueueDto,
    @CurrentUser() user: User,
  ): Promise<QueueResponseDto> {
    const queue = await this.queueService.markAsAttended(query.sessionId, user.id, user);
    return queue as QueueResponseDto;
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer queue item to another user' })
  @ApiResponse({
    status: 200,
    description: 'Queue item transferred successfully',
    type: QueueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Queue item not found or target user not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data',
  })
  async transferQueue(@Body() transferQueueDto: TransferQueueDto): Promise<QueueResponseDto> {
    const queue = await this.queueService.transferQueue(transferQueueDto.sessionId, transferQueueDto.userId);
    return queue as QueueResponseDto;
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        bot: { type: 'number' },
        waiting: { type: 'number' },
        service: { type: 'number' },
        averageWaitingTime: { type: 'number' },
      },
    },
  })
  async getQueueStatistics(): Promise<{
    total: number;
    bot: number;
    waiting: number;
    service: number;
    averageWaitingTime: number;
  }> {
    return this.queueService.getQueueStatistics();
  }

  @Delete('clear-all')
  @ApiOperation({ summary: 'Clear all Redis queues and messages' })
  @ApiResponse({
    status: 200,
    description: 'All queues and messages cleared successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        clearedCount: { type: 'number' },
        messagesClearedCount: { type: 'number' },
      },
    },
  })
  async clearAllQueues(): Promise<{ message: string; clearedCount: number; messagesClearedCount: number }> {
    return this.queueService.clearAllQueues();
  }
}
