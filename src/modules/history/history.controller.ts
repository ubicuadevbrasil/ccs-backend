import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { 
  CreateHistoryDto, 
  UpdateHistoryByIdDto, 
  HistoryQueryDto, 
  FindHistoryDto, 
  DeleteHistoryDto, 
  HistoryResponseDto 
} from './dto/history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { History } from './entities/history.entity';

@ApiTags('History')
@Controller('history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new history record' })
  @ApiResponse({
    status: 201,
    description: 'History created successfully',
    type: HistoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or foreign key references',
  })
  async createHistory(@Body() createHistoryDto: CreateHistoryDto): Promise<HistoryResponseDto> {
    const history = await this.historyService.createHistory(createHistoryDto);
    return history as HistoryResponseDto;
  }

  @Get('list')
  @ApiOperation({ summary: 'Get all history records with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for sessionId or observations' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'tabulationId', required: false, description: 'Filter by tabulation ID' })
  @ApiQuery({ name: 'platform', required: false, description: 'Filter by platform' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO string)' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active interactions' })
  @ApiQuery({ name: 'isAttended', required: false, description: 'Filter by attended interactions' })
  @ApiQuery({ name: 'isFinished', required: false, description: 'Filter by finished interactions' })
  @ApiResponse({
    status: 200,
    description: 'History records retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/HistoryResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAllHistory(@Query() query: HistoryQueryDto) {
    return this.historyService.findAllHistory(query);
  }

  @Get('find')
  @ApiOperation({ summary: 'Find history record by ID' })
  @ApiQuery({ name: 'id', description: 'History ID' })
  @ApiResponse({
    status: 200,
    description: 'History record retrieved successfully',
    type: HistoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'History record not found',
  })
  async findHistoryById(@Query() query: FindHistoryDto): Promise<HistoryResponseDto> {
    const history = await this.historyService.findHistoryById(query.id);
    return history as HistoryResponseDto;
  }

  @Patch('update')
  @ApiOperation({ summary: 'Update history record by ID' })
  @ApiResponse({
    status: 200,
    description: 'History record updated successfully',
    type: HistoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'History record not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or foreign key references',
  })
  async updateHistory(@Body() updateHistoryDto: UpdateHistoryByIdDto): Promise<HistoryResponseDto> {
    const { id, ...updateData } = updateHistoryDto;
    const history = await this.historyService.updateHistory(id, updateData);
    return history as HistoryResponseDto;
  }

  @Delete('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete history record by ID' })
  @ApiResponse({
    status: 204,
    description: 'History record deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'History record not found',
  })
  async deleteHistory(@Body() deleteHistoryDto: DeleteHistoryDto): Promise<void> {
    return this.historyService.deleteHistory(deleteHistoryDto.id);
  }

  @Get('session')
  @ApiOperation({ summary: 'Find history records by session ID' })
  @ApiQuery({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'History records retrieved successfully',
    type: [HistoryResponseDto],
  })
  async findHistoryBySessionId(@Query('sessionId') sessionId: string): Promise<HistoryResponseDto[]> {
    const histories = await this.historyService.findHistoryBySessionId(sessionId);
    return histories as HistoryResponseDto[];
  }

  @Get('session/active')
  @ApiOperation({ summary: 'Find active history record by session ID' })
  @ApiQuery({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Active history record retrieved successfully',
    type: HistoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No active history record found for this session',
  })
  async findActiveHistoryBySessionId(@Query('sessionId') sessionId: string): Promise<HistoryResponseDto | null> {
    const history = await this.historyService.findActiveHistoryBySessionId(sessionId);
    return history as HistoryResponseDto | null;
  }

  @Patch('mark-attended')
  @ApiOperation({ summary: 'Mark history record as attended' })
  @ApiResponse({
    status: 200,
    description: 'History record marked as attended successfully',
    type: HistoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'History record not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid attendedAt date',
  })
  async markAsAttended(@Body() body: { id: string; attendedAt?: string }): Promise<HistoryResponseDto> {
    const attendedAt = body.attendedAt ? new Date(body.attendedAt) : undefined;
    const history = await this.historyService.markAsAttended(body.id, attendedAt);
    return history as HistoryResponseDto;
  }

  @Patch('mark-finished')
  @ApiOperation({ summary: 'Mark history record as finished' })
  @ApiResponse({
    status: 200,
    description: 'History record marked as finished successfully',
    type: HistoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'History record not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid finishedAt date',
  })
  async markAsFinished(@Body() body: { id: string; finishedAt?: string }): Promise<HistoryResponseDto> {
    const finishedAt = body.finishedAt ? new Date(body.finishedAt) : undefined;
    const history = await this.historyService.markAsFinished(body.id, finishedAt);
    return history as HistoryResponseDto;
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get history statistics' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'platform', required: false, description: 'Filter by platform' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO string)' })
  @ApiResponse({
    status: 200,
    description: 'History statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        active: { type: 'number' },
        attended: { type: 'number' },
        finished: { type: 'number' },
        averageDuration: { type: 'number' },
        averageAttendanceTime: { type: 'number' },
      },
    },
  })
  async getHistoryStatistics(@Query() query: {
    userId?: string;
    customerId?: string;
    platform?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const filters = {
      userId: query.userId,
      customerId: query.customerId,
      platform: query.platform as any,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    return this.historyService.getHistoryStatistics(filters);
  }
}
