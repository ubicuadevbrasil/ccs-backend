import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import {
  CardsMetricsResponseDto,
  OperatorsQueryDto,
  OperatorsResponseDto,
  ActiveServicesQueryDto,
  ActiveServicesResponseDto,
} from './dto/analytics.dto';

@ApiTags('Dashboard Analytics')
@Controller('dashboard/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('cards')
  @ApiOperation({ summary: 'Get dashboard cards metrics' })
  @ApiResponse({
    status: 200,
    description: 'Cards metrics retrieved successfully',
    type: CardsMetricsResponseDto,
  })
  async getCardsMetrics(): Promise<CardsMetricsResponseDto> {
    return this.analyticsService.getCardsMetrics();
  }

  @Get('operators')
  @ApiOperation({ summary: 'Get operators with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for user name, email, or contact' })
  @ApiResponse({
    status: 200,
    description: 'Operators retrieved successfully',
    type: OperatorsResponseDto,
  })
  async getOperators(@Query() query: OperatorsQueryDto): Promise<OperatorsResponseDto> {
    return this.analyticsService.getOperators(query);
  }

  @Get('services')
  @ApiOperation({ summary: 'Get active services with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for protocol, customer name, or customer number' })
  @ApiQuery({ name: 'direction', required: false, description: 'Filter by direction (inbound/outbound)', enum: ['inbound', 'outbound'] })
  @ApiResponse({
    status: 200,
    description: 'Active services retrieved successfully',
    type: ActiveServicesResponseDto,
  })
  async getActiveServices(@Query() query: ActiveServicesQueryDto): Promise<ActiveServicesResponseDto> {
    return this.analyticsService.getActiveServices(query);
  }
}

