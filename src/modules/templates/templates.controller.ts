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
import { TemplatesService } from './templates.service';
import {
  CreateTemplateDto,
  UpdateTemplateByIdDto,
  TemplateQueryDto,
  FindTemplateDto,
  DeleteTemplateDto,
  TemplateResponseDto,
  SyncTemplatesDto,
} from './dto/template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Template } from './entities/template.entity';

@ApiTags('Templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: TemplateResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Template with this template_code already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createTemplate(
    @Body() createTemplateDto: CreateTemplateDto,
  ): Promise<TemplateResponseDto> {
    const template = await this.templatesService.createTemplate(
      createTemplateDto,
    );
    return this.templatesService.mapTemplateToResponseDto(template) as TemplateResponseDto;
  }

  @Get('list')
  @ApiOperation({ summary: 'Get all templates with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for template_code or content',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'template_code',
    required: false,
    description: 'Filter by template code',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/TemplateResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAllTemplates(@Query() query: TemplateQueryDto) {
    const result = await this.templatesService.findAllTemplates(query);
    return {
      ...result,
      data: result.data.map((template) =>
        this.templatesService.mapTemplateToResponseDto(template),
      ),
    };
  }

  @Get('find')
  @ApiOperation({ summary: 'Find template by ID' })
  @ApiQuery({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
    type: TemplateResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async findTemplateById(
    @Query() query: FindTemplateDto,
  ): Promise<TemplateResponseDto> {
    const template = await this.templatesService.findTemplateById(query.id);
    return this.templatesService.mapTemplateToResponseDto(template) as TemplateResponseDto;
  }

  @Patch('update')
  @ApiOperation({ summary: 'Update template by ID' })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
    type: TemplateResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async updateTemplate(
    @Body() updateTemplateDto: UpdateTemplateByIdDto,
  ): Promise<TemplateResponseDto> {
    const { id, ...updateData } = updateTemplateDto;
    const template = await this.templatesService.updateTemplate(id, updateData);
    return this.templatesService.mapTemplateToResponseDto(template) as TemplateResponseDto;
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete template by ID' })
  @ApiResponse({
    status: 204,
    description: 'Template deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async deleteTemplate(@Body() deleteTemplateDto: DeleteTemplateDto): Promise<void> {
    return this.templatesService.deleteTemplate(deleteTemplateDto.id);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync templates from Otima API',
    description:
      'Fetches templates from Otima API and updates the local database. Creates new templates or updates existing ones based on template_code.',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates synced successfully',
    schema: {
      type: 'object',
      properties: {
        created: { type: 'number', description: 'Number of templates created' },
        updated: { type: 'number', description: 'Number of templates updated' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid response format from Otima API',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - failed to sync templates',
  })
  async syncTemplates(@Body() syncDto: SyncTemplatesDto) {
    return this.templatesService.syncTemplatesFromOtima(syncDto.customerCode);
  }
}

