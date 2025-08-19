import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { TabulationStatusSubService } from './tabulation-status-sub.service';
import { CreateTabulationStatusSubDto } from './dto/create-tabulation-status-sub.dto';
import { UpdateTabulationStatusSubDto } from './dto/update-tabulation-status-sub.dto';
import { TabulationStatusSubResponseDto } from './dto/tabulation-status-sub.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tabulation Status Sub')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tabulation-status-sub')
export class TabulationStatusSubController {
  constructor(private readonly tabulationStatusSubService: TabulationStatusSubService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tabulation status sub' })
  @ApiResponse({ 
    status: 201, 
    description: 'Tabulation status sub created successfully', 
    type: TabulationStatusSubResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Referenced tabulation status does not exist' })
  async create(@Body() createTabulationStatusSubDto: CreateTabulationStatusSubDto) {
    return this.tabulationStatusSubService.create(createTabulationStatusSubDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active tabulation status subs' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all active tabulation status subs retrieved successfully', 
    type: [TabulationStatusSubResponseDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async findAll() {
    return this.tabulationStatusSubService.findAll();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all tabulation status subs including inactive ones (admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all tabulation status subs including inactive ones retrieved successfully', 
    type: [TabulationStatusSubResponseDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async findAllIncludingInactive() {
    return this.tabulationStatusSubService.findAllIncludingInactive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tabulation status sub by ID' })
  @ApiParam({ name: 'id', description: 'Tabulation Status Sub ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulation status sub found successfully', 
    type: TabulationStatusSubResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation status sub does not exist' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tabulationStatusSubService.findOne(id);
  }

  @Get('status/:tabulationStatusId')
  @ApiOperation({ summary: 'Get tabulation status subs by tabulation status ID' })
  @ApiParam({ name: 'tabulationStatusId', description: 'Tabulation Status ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulation status subs for status retrieved successfully', 
    type: [TabulationStatusSubResponseDto] 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation status does not exist' })
  async findByTabulationStatusId(@Param('tabulationStatusId', ParseUUIDPipe) tabulationStatusId: string) {
    return this.tabulationStatusSubService.findByTabulationStatusId(tabulationStatusId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tabulation status sub by ID' })
  @ApiParam({ name: 'id', description: 'Tabulation Status Sub ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulation status sub updated successfully', 
    type: TabulationStatusSubResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation status sub does not exist' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTabulationStatusSubDto: UpdateTabulationStatusSubDto,
  ) {
    return this.tabulationStatusSubService.update(id, updateTabulationStatusSubDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete tabulation status sub by ID (sets active to false)' })
  @ApiParam({ name: 'id', description: 'Tabulation Status Sub ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 204, description: 'Tabulation status sub soft deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation status sub does not exist' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tabulationStatusSubService.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore soft deleted tabulation status sub by ID (sets active to true)' })
  @ApiParam({ name: 'id', description: 'Tabulation Status Sub ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulation status sub restored successfully', 
    type: TabulationStatusSubResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation status sub does not exist' })
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.tabulationStatusSubService.restore(id);
  }
}
