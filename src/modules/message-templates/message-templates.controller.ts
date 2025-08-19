import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiSecurity,
  ApiHeader
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageTemplatesService } from './message-templates.service';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';
import { QueryMessageTemplateDto } from './dto/query-message-template.dto';
import {
  MessageTemplateResponseDto,
  MessageTemplateListResponseDto,
  MessageTemplateStatsResponseDto,
  CreateMessageTemplateResponseDto,
  UpdateMessageTemplateResponseDto
} from './dto/message-template-response.dto';
import type { MessageTemplate } from './interfaces/message-template.interface';

@ApiTags('Message Templates')
@ApiBearerAuth()
@ApiSecurity('JWT')
@UseGuards(JwtAuthGuard)
@Controller('message-templates')
export class MessageTemplatesController {
  constructor(private readonly messageTemplatesService: MessageTemplatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new message template',
    description: 'Creates a new message template with the specified content and type. Requires JWT authentication.'
  })
  @ApiBody({
    type: CreateMessageTemplateDto,
    description: 'Message template data',
    examples: {
      greeting: {
        summary: 'Greeting Template',
        value: {
          message: '¡Hola! Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte hoy?',
          type: 'greeting'
        }
      },
      support: {
        summary: 'Support Template',
        value: {
          message: 'Entiendo tu situación. Déjame investigar esto para ti y te respondo en breve.',
          type: 'support'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Message template created successfully',
    type: CreateMessageTemplateResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Invalid JWT token'
  })
  async create(@Body() createMessageTemplateDto: CreateMessageTemplateDto): Promise<MessageTemplate> {
    return this.messageTemplatesService.createMessageTemplate(createMessageTemplateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all message templates',
    description: 'Retrieves a paginated list of message templates with optional filtering and search capabilities. Requires JWT authentication.'
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter templates by type',
    enum: ['greeting', 'follow_up', 'reminder', 'support', 'marketing', 'notification', 'custom'],
    example: 'greeting'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search templates by message content',
    example: 'hello'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of templates per page (1-100)',
    example: 20
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of templates to skip for pagination',
    example: 0
  })
  @ApiResponse({
    status: 200,
    description: 'Message templates retrieved successfully',
    type: MessageTemplateListResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Invalid JWT token'
  })
  async findAll(@Query() query: QueryMessageTemplateDto) {
    return this.messageTemplatesService.findAllMessageTemplates({
      type: query.type,
      search: query.search,
      limit: query.limit,
      offset: query.offset
    });
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get message template statistics',
    description: 'Retrieves statistics about message templates including total count and breakdown by type. Requires JWT authentication.'
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: MessageTemplateStatsResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Invalid JWT token'
  })
  async getStats() {
    return this.messageTemplatesService.getTemplateStats();
  }

  @Get('random/:type')
  @ApiOperation({
    summary: 'Get a random template by type',
    description: 'Retrieves a random message template of the specified type. Useful for automated messaging. Requires JWT authentication.'
  })
  @ApiParam({
    name: 'type',
    description: 'Template type to get random template from',
    enum: ['greeting', 'follow_up', 'reminder', 'support', 'marketing', 'notification', 'custom'],
    example: 'greeting'
  })
  @ApiResponse({
    status: 200,
    description: 'Random template retrieved successfully',
    type: MessageTemplateResponseDto
  })
  @ApiResponse({
    status: 200,
    description: 'No templates found for the specified type',
    schema: {
      type: 'null'
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid template type'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Invalid JWT token'
  })
  async getRandomByType(@Param('type') type: string): Promise<MessageTemplate | null> {
    // Validate template type
    const validTypes = ['greeting', 'follow_up', 'reminder', 'support', 'marketing', 'notification', 'custom'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(`Invalid template type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    return this.messageTemplatesService.getRandomTemplateByType(type);
  }

  @Get('type/:type')
  @ApiOperation({
    summary: 'Get templates by type',
    description: 'Retrieves all message templates of a specific type, ordered by creation date. Requires JWT authentication.'
  })
  @ApiParam({
    name: 'type',
    description: 'Template type to filter by',
    enum: ['greeting', 'follow_up', 'reminder', 'support', 'marketing', 'notification', 'custom'],
    example: 'greeting'
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
    type: [MessageTemplateResponseDto]
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid template type'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Invalid JWT token'
  })
  async findByType(@Param('type') type: string): Promise<MessageTemplate[]> {
    // Validate template type
    const validTypes = ['greeting', 'follow_up', 'reminder', 'support', 'marketing', 'notification', 'custom'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(`Invalid template type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    return this.messageTemplatesService.findMessageTemplatesByType(type);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get message template by ID',
    description: 'Retrieves a specific message template by its unique identifier. Requires JWT authentication.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the message template',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({
    status: 200,
    description: 'Message template retrieved successfully',
    type: MessageTemplateResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid UUID format'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Invalid JWT token'
  })
  @ApiResponse({
    status: 404,
    description: 'Message template not found'
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MessageTemplate> {
    return this.messageTemplatesService.findMessageTemplateById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update message template',
    description: 'Updates an existing message template with new content and/or type. Requires JWT authentication.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the message template to update',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiBody({
    type: UpdateMessageTemplateDto,
    description: 'Message template update data',
    examples: {
      messageOnly: {
        summary: 'Update Message Only',
        value: {
          message: 'Updated welcome message with new content'
        }
      },
      typeOnly: {
        summary: 'Update Type Only',
        value: {
          type: 'support'
        }
      },
      both: {
        summary: 'Update Both Message and Type',
        value: {
          message: 'Updated support message',
          type: 'support'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Message template updated successfully',
    type: UpdateMessageTemplateResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data or UUID format'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Invalid JWT token'
  })
  @ApiResponse({
    status: 404,
    description: 'Message template not found'
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMessageTemplateDto: UpdateMessageTemplateDto
  ): Promise<MessageTemplate> {
    return this.messageTemplatesService.updateMessageTemplate(id, updateMessageTemplateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete message template',
    description: 'Permanently deletes a message template by its unique identifier. This action cannot be undone. Requires JWT authentication.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the message template to delete',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({
    status: 204,
    description: 'Message template deleted successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid UUID format'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Invalid JWT token'
  })
  @ApiResponse({
    status: 404,
    description: 'Message template not found'
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.messageTemplatesService.deleteMessageTemplate(id);
  }
}
