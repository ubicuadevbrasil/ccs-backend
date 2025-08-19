import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MailingService } from './mailing.service';
import { CreateMailingDto, UpdateMailingDto } from './dto/mailing.dto';
import { MailingEntity } from './dto/mailing.entity';

@ApiTags('Mailing')
@Controller('mailing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MailingController {
  constructor(private readonly mailingService: MailingService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new mailing campaign',
    description: 'Create a new mailing campaign with name, URL, and message',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Mailing campaign created successfully',
    type: MailingEntity,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token required',
  })
  create(@Body() createMailingDto: CreateMailingDto) {
    return this.mailingService.create(createMailingDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all mailing campaigns',
    description: 'Retrieve all mailing campaigns ordered by creation date',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mailing campaigns retrieved successfully',
    type: [MailingEntity],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token required',
  })
  findAll() {
    return this.mailingService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a mailing campaign by ID',
    description: 'Retrieve a specific mailing campaign by its ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mailing campaign retrieved successfully',
    type: MailingEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mailing campaign not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token required',
  })
  findOne(@Param('id') id: string) {
    return this.mailingService.findOne(id);
  }

  @Get(':id/queues')
  @ApiOperation({
    summary: 'Get a mailing campaign with queue details',
    description: 'Retrieve a specific mailing campaign by its ID including all queue information and statistics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mailing campaign with queues retrieved successfully',
    type: MailingEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mailing campaign not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token required',
  })
  findOneWithQueues(@Param('id') id: string) {
    return this.mailingService.findOneWithQueues(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a mailing campaign',
    description: 'Update an existing mailing campaign',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mailing campaign updated successfully',
    type: MailingEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mailing campaign not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token required',
  })
  update(@Param('id') id: string, @Body() updateMailingDto: UpdateMailingDto) {
    return this.mailingService.update(id, updateMailingDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a mailing campaign',
    description: 'Remove a mailing campaign by its ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mailing campaign deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mailing campaign not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token required',
  })
  remove(@Param('id') id: string) {
    return this.mailingService.remove(id);
  }
}
