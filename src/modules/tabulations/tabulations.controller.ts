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
import { TabulationsService } from './tabulations.service';
import { CreateTabulationDto } from './dto/create-tabulation.dto';
import { UpdateTabulationDto } from './dto/update-tabulation.dto';
import { TabulationResponseDto } from './dto/tabulation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tabulations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tabulations')
export class TabulationsController {
  constructor(private readonly tabulationsService: TabulationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tabulation' })
  @ApiResponse({ 
    status: 201, 
    description: 'Tabulation created successfully', 
    type: TabulationResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Referenced entities do not exist' })
  async create(@Body() createTabulationDto: CreateTabulationDto) {
    return this.tabulationsService.create(createTabulationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tabulations' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all tabulations retrieved successfully', 
    type: [TabulationResponseDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async findAll() {
    return this.tabulationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tabulation by ID' })
  @ApiParam({ name: 'id', description: 'Tabulation ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulation found successfully', 
    type: TabulationResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation does not exist' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tabulationsService.findOne(id);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get tabulations by session ID' })
  @ApiParam({ name: 'sessionId', description: 'Session ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulations for session retrieved successfully', 
    type: [TabulationResponseDto] 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Session does not exist' })
  async findBySessionId(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.tabulationsService.findBySessionId(sessionId);
  }

  @Get('user/:tabulatedBy')
  @ApiOperation({ summary: 'Get tabulations by user who performed them' })
  @ApiParam({ name: 'tabulatedBy', description: 'User ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulations by user retrieved successfully', 
    type: [TabulationResponseDto] 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - User does not exist' })
  async findByTabulatedBy(@Param('tabulatedBy', ParseUUIDPipe) tabulatedBy: string) {
    return this.tabulationsService.findByTabulatedBy(tabulatedBy);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tabulation by ID' })
  @ApiParam({ name: 'id', description: 'Tabulation ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tabulation updated successfully', 
    type: TabulationResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation does not exist' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTabulationDto: UpdateTabulationDto,
  ) {
    return this.tabulationsService.update(id, updateTabulationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tabulation by ID' })
  @ApiParam({ name: 'id', description: 'Tabulation ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 204, description: 'Tabulation deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 404, description: 'Not found - Tabulation does not exist' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tabulationsService.remove(id);
  }
}
