import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpStatus,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import {
  DashboardCardsResponse,
  DashboardOperatorsResponse,
  DashboardTabulationsResponse,
  DashboardQueuesResponse,
} from './interfaces/dashboard.interface';
import { DashboardCardsDto, DashboardTabulationsDto } from './dto/dashboard.dto';
import { Department } from '../queues/interfaces/queue.interface';
import { MailingService } from '../mailing/mailing.service';
import { MailingQueueManagerService } from '../mailing/mailing-queue-manager.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly mailingService: MailingService,
    private readonly mailingQueueManagerService: MailingQueueManagerService,
  ) {}

  @Get('cards')
  @ApiOperation({
    summary: 'Get dashboard cards metrics',
    description: 'Retrieve key metrics for dashboard cards including queue statistics and customer counts',
  })
  @ApiQuery({
    name: 'department',
    required: false,
    enum: Department,
    description: 'Filter metrics by department',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date in ISO format (YYYY-MM-DD). If not provided, current day is used.',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date in ISO format (YYYY-MM-DD). If not provided, current day is used.',
    example: '2024-01-31',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard cards metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        customersWaitingInQueue: {
          type: 'number',
          description: 'Number of customers waiting in queue',
        },
        averageWaitingTime: {
          type: 'number',
          description: 'Average waiting time in minutes',
        },
        customersInService: {
          type: 'number',
          description: 'Number of customers currently being served',
        },
        tabulatedCustomers: {
          type: 'number',
          description: 'Number of customers that have been tabulated',
        },
        queueEntries: {
          type: 'object',
          properties: {
            inbound: {
              type: 'number',
              description: 'Number of inbound queue entries',
            },
            outbound: {
              type: 'number',
              description: 'Number of outbound queue entries',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token required',
  })
  async getDashboardCards(
    @Query() query: DashboardCardsDto,
  ): Promise<DashboardCardsResponse> {
    return this.dashboardService.getDashboardCards(query);
  }

  @Get('operators')
  @ApiOperation({
    summary: 'Get dashboard operators metrics',
    description: 'Retrieve metrics for all connected operators including online time and customer statistics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard operators metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        operators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'Operator user ID',
              },
              userName: {
                type: 'string',
                description: 'Operator name',
              },
              onlineTime: {
                type: 'number',
                description: 'Time online in minutes',
              },
              customersInService: {
                type: 'number',
                description: 'Number of customers currently being served by this operator',
              },
              tabulatedCustomers: {
                type: 'number',
                description: 'Number of customers tabulated by this operator',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token required',
  })
  async getDashboardOperators(): Promise<DashboardOperatorsResponse> {
    return this.dashboardService.getDashboardOperators();
  }

  @Get('tabulations')
  @ApiOperation({
    summary: 'Get dashboard tabulations data',
    description: 'Retrieve information about completed queue services that were tabulated successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter by start date in ISO format (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter by end date in ISO format (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiQuery({
    name: 'customerName',
    required: false,
    type: String,
    description: 'Filter by customer name (partial match)',
    example: 'John Doe',
  })
  @ApiQuery({
    name: 'customerPhone',
    required: false,
    type: String,
    description: 'Filter by customer phone number',
    example: '5511999999999',
  })
  @ApiQuery({
    name: 'customerCpf',
    required: false,
    type: String,
    description: 'Filter by customer CPF',
    example: '12345678901',
  })
  @ApiQuery({
    name: 'customerEmail',
    required: false,
    type: String,
    description: 'Filter by customer email (partial match)',
    example: 'john@example.com',
  })
  @ApiQuery({
    name: 'direction',
    required: false,
    enum: ['inbound', 'outbound'],
    description: 'Filter by queue direction',
    example: 'inbound',
  })
  @ApiQuery({
    name: 'tabulationStatus',
    required: false,
    type: String,
    description: 'Filter by tabulation status ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard tabulations data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        tabulations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: {
                type: 'string',
                description: 'Queue session ID',
              },
              customerName: {
                type: 'string',
                description: 'Customer name',
              },
              customerPhone: {
                type: 'string',
                description: 'Customer phone number (remoteJid)',
              },
              customerEmail: {
                type: 'string',
                description: 'Customer email address',
              },
              customerCpf: {
                type: 'string',
                description: 'Customer CPF (Brazilian individual tax ID)',
              },
              userName: {
                type: 'string',
                description: 'Name of the user who tabulated',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Queue creation timestamp',
              },
              completedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Queue completion timestamp',
              },
              direction: {
                type: 'string',
                description: 'Queue direction (inbound/outbound)',
              },
              tabulationStatusDescription: {
                type: 'string',
                description: 'Main tabulation status description',
              },
              tabulationStatusSubDescription: {
                type: 'string',
                description: 'Sub-status description',
              },
            },
          },
        },
        total: {
          type: 'number',
          description: 'Total number of tabulations found',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token required',
  })
  async getDashboardTabulations(
    @Query() query: DashboardTabulationsDto,
  ): Promise<DashboardTabulationsResponse> {
    return this.dashboardService.getDashboardTabulations(query);
  }

  @Get('queues')
  @ApiOperation({
    summary: 'Get dashboard queues information',
    description: 'Retrieve information about active queues (typebot, waiting, service) for supervisor dashboard',
  })
  @ApiQuery({
    name: 'department',
    required: false,
    enum: Department,
    description: 'Filter queues by department',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard queues information retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sessionId: {
            type: 'string',
            description: 'Queue session ID',
          },
          customerName: {
            type: 'string',
            description: 'Customer name',
          },
          customerPhone: {
            type: 'string',
            description: 'Customer phone number',
          },
          userName: {
            type: 'string',
            description: 'Name of the assigned operator',
          },
          supervisorName: {
            type: 'string',
            description: 'Name of the supervisor',
          },
          status: {
            type: 'string',
            description: 'Current queue status (typebot, waiting, service)',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Queue creation timestamp',
          },
          assignedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Queue assignment timestamp',
          },
          department: {
            type: 'string',
            description: 'Queue department',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token required',
  })
  async getDashboardQueues(
    @Query('department') department?: Department,
  ): Promise<DashboardQueuesResponse[]> {
    return this.dashboardService.getDashboardQueues(department);
  }

  @Post('upload-mailing')
  @ApiOperation({
    summary: 'Create mailing campaign from XLSX URL',
    description: 'Create a mailing campaign by providing a URL to an XLSX file containing contact information',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileUrl: {
          type: 'string',
          description: 'URL to the XLSX file containing contact information',
          example: 'https://example.com/contacts.xlsx',
        },
        name: {
          type: 'string',
          description: 'Name of the mailing campaign',
          example: 'Monthly Newsletter',
        },
        message: {
          type: 'string',
          description: 'Message to send to all contacts',
          example: 'Hello! Here\'s our monthly newsletter...',
        },
      },
      required: ['fileUrl', 'name', 'message'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Mailing campaign created successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the operation was successful',
        },
        mailingId: {
          type: 'string',
          description: 'ID of the created mailing campaign',
        },
        message: {
          type: 'string',
          description: 'Success message',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - Invalid URL or missing required fields',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT token required',
  })
  async uploadXlsx(
    @Body('fileUrl') fileUrl: string,
    @Body('name') name: string,
    @Body('message') message: string,
  ) {
    if (!fileUrl || !name || !message) {
      throw new Error('File URL, name, and message are required');
    }

    try {
      // Create mailing record
      const mailing = await this.mailingService.create({
        name,
        url: fileUrl,
        message,
      });

      // Add the mailing job to the queue for background processing
      await this.mailingQueueManagerService.addMailingJob(
        mailing.id,
        fileUrl,
        message,
      );

      return {
        success: true,
        mailingId: mailing.id,
        message: 'Mailing campaign created successfully',
      };
    } catch (error) {
      throw new Error(`Failed to create mailing campaign: ${error.message}`);
    }
  }
}
