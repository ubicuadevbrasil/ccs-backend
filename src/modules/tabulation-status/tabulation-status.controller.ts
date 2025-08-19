import {
  Controller,
  Get,
  Post,
  Put,
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
import { TabulationStatusService } from './tabulation-status.service';
import { CreateTabulationStatusWithSubsDto } from './dto/create-tabulation-status-with-subs.dto';
import { UpdateTabulationStatusDto } from './dto/update-tabulation-status.dto';
import { ManageTabulationStatusSubsDto } from './dto/manage-tabulation-status-subs.dto';
import { TabulationStatusResponseDto } from './dto/tabulation-status.dto';
import { ManageTabulationStatusSubsResponseDto } from './dto/manage-tabulation-status-subs-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tabulation Status')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tabulation-status')
export class TabulationStatusController {
  constructor(private readonly tabulationStatusService: TabulationStatusService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tabulation status with optional sub items' })
  @ApiResponse({ 
    status: 201, 
    description: 'Tabulation status created successfully', 
    type: TabulationStatusResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async create(@Body() createTabulationStatusDto: CreateTabulationStatusWithSubsDto) {
    return this.tabulationStatusService.create(createTabulationStatusDto);
  }

  @Put(':id/subs')
  @ApiOperation({ summary: 'Manage tabulation status sub items (create, update, or delete)' })
  @ApiParam({ name: 'id', description: 'Tabulation Status ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulation status sub items managed successfully',
    type: ManageTabulationStatusSubsResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation status does not exist' })
  async manageSubItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() manageSubsDto: ManageTabulationStatusSubsDto
  ): Promise<ManageTabulationStatusSubsResponseDto> {
    return this.tabulationStatusService.manageSubItems(
      id,
      manageSubsDto.target,
      manageSubsDto.createItems,
      manageSubsDto.updateItems,
      manageSubsDto.deleteItems
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all active tabulation statuses' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all active tabulation statuses retrieved successfully', 
    type: [TabulationStatusResponseDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async findAll() {
    return this.tabulationStatusService.findAll();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all tabulation statuses including inactive ones (admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all tabulation statuses including inactive ones retrieved successfully', 
    type: [TabulationStatusResponseDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async findAllIncludingInactive() {
    return this.tabulationStatusService.findAllIncludingInactive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tabulation status by ID' })
  @ApiParam({ name: 'id', description: 'Tabulation Status ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulation status found successfully', 
    type: TabulationStatusResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation status does not exist' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tabulationStatusService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tabulation status by ID' })
  @ApiParam({ name: 'id', description: 'Tabulation Status ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulation status updated successfully', 
    type: TabulationStatusResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation status does not exist' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTabulationStatusDto: UpdateTabulationStatusDto,
  ) {
    return this.tabulationStatusService.update(id, updateTabulationStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete tabulation status by ID (sets active to false)' })
  @ApiParam({ name: 'id', description: 'Tabulation Status ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 204, description: 'Tabulation status soft deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation status does not exist' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tabulationStatusService.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore soft deleted tabulation status by ID (sets active to true)' })
  @ApiParam({ name: 'id', description: 'Tabulation Status ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulation status restored successfully', 
    type: TabulationStatusResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation status does not exist' })
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.tabulationStatusService.restore(id);
  }
}
