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
import { TabulationService } from './tabulation.service';
import { 
  CreateTabulationDto, 
  UpdateTabulationByIdDto, 
  TabulationQueryDto, 
  FindTabulationDto, 
  DeleteTabulationDto, 
  TabulationResponseDto 
} from './dto/tabulation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Tabulation } from './entities/tabulation.entity';

@ApiTags('Tabulations')
@Controller('tabulations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TabulationController {
  constructor(private readonly tabulationService: TabulationService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new tabulation with subs' })
  @ApiResponse({
    status: 201,
    description: 'Tabulation created successfully',
    type: TabulationResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Tabulation with this name already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createTabulation(@Body() createTabulationDto: CreateTabulationDto): Promise<TabulationResponseDto> {
    const tabulation = await this.tabulationService.createTabulation(createTabulationDto);
    return tabulation as TabulationResponseDto;
  }

  @Get('list')
  @ApiOperation({ summary: 'Get all tabulations with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({
    status: 200,
    description: 'Tabulations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/TabulationResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAllTabulations(@Query() query: TabulationQueryDto) {
    return this.tabulationService.findAllTabulations(query);
  }

  @Get('find')
  @ApiOperation({ summary: 'Find tabulation by ID with subs' })
  @ApiQuery({ name: 'id', description: 'Tabulation ID' })
  @ApiResponse({
    status: 200,
    description: 'Tabulation retrieved successfully',
    type: TabulationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tabulation not found',
  })
  async findTabulationById(@Query() query: FindTabulationDto): Promise<TabulationResponseDto> {
    const tabulation = await this.tabulationService.findTabulationByIdWithSubs(query.id);
    return tabulation as TabulationResponseDto;
  }

  @Patch('update')
  @ApiOperation({ summary: 'Update tabulation by ID with subs' })
  @ApiResponse({
    status: 200,
    description: 'Tabulation updated successfully',
    type: TabulationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tabulation not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Tabulation with this name already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async updateTabulation(@Body() updateTabulationDto: UpdateTabulationByIdDto): Promise<TabulationResponseDto> {
    const { id, ...updateData } = updateTabulationDto;
    const tabulation = await this.tabulationService.updateTabulation(id, updateData);
    return tabulation as TabulationResponseDto;
  }

  @Delete('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tabulation by ID (soft delete - set status to inactive)' })
  @ApiResponse({
    status: 204,
    description: 'Tabulation deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tabulation not found',
  })
  async deleteTabulation(@Body() deleteTabulationDto: DeleteTabulationDto): Promise<void> {
    return this.tabulationService.deleteTabulation(deleteTabulationDto.id);
  }
}
