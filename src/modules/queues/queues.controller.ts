import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  BadRequestException,
  NotFoundException,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
  ApiSecurity,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueuesService } from './queues.service';
import { QueueWithCustomer } from './interfaces/queue.interface';
import { 
  QueueWithCustomerResponseDto, 
  TransferQueueDto, 
  CompleteQueueServiceDto,
  ConversationHistoryItemDto
} from './dto/queue.dto';
import { QueueStatus } from './interfaces/queue.interface';

@ApiTags('Queues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('queues')
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Get('waiting')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get waiting users in queues for the authenticated operator/supervisor',
    description: `Fetches all queues with status "waiting" where the authenticated user is either:
    - The requested operator (requestedOperatorId matches user ID)
    - The supervisor (supervisorId matches user ID)
    
    This endpoint is designed for operators and supervisors to see their pending queue items.
    The response includes complete customer information for each waiting queue.`
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Waiting users retrieved successfully',
    type: [QueueWithCustomerResponseDto],
    schema: {
      example: [
        {
          id: 'queue-123',
          sessionId: 'session-456',
          customerId: 'customer-789',
          status: 'waiting',
          department: 'Personal',
          requestedOperatorId: 'operator-123',
          assignedOperatorId: null,
          supervisorId: 'supervisor-456',
          typebotData: {},
          customerDepartmentChoice: 'Personal',
          customerOperatorChoice: null,
          operatorAvailable: true,
          createdAt: '2024-01-15T10:30:00Z',
          typebotCompletedAt: '2024-01-15T10:35:00Z',
          assignedAt: null,
          completedAt: null,
          evolutionInstance: 'instance-1',
          typebotSessionUrl: 'https://typebot.io/session/123',
          metadata: {},
          customer: {
            id: 'customer-789',
            remoteJid: '5511999999999@s.whatsapp.net',
            pushName: 'John Doe',
            profilePicUrl: 'https://example.com/profile.jpg',
            email: 'john@example.com',
            cpf: '12345678901',
            cnpj: null,
            priority: 1,
            isGroup: false,
            isSaved: true,
            type: 'contact',
            status: 'active',
            createdAt: '2024-01-15T10:25:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          }
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have permission to access queues',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden',
        error: 'Forbidden'
      }
    }
  })
  @ApiSecurity('bearer')
  async getWaitingUsers(@Request() req): Promise<QueueWithCustomer[]> {
    const userId = req.user.id;
    return this.queuesService.findWaitingQueuesByUser(userId);
  }

  @Get('service')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get service customers in queues for the authenticated operator',
    description: `Fetches all queues with status "service" where the authenticated user is the assigned operator.
    
    This endpoint is designed for operators/supervisors to see their assigned queue items.`
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service customers retrieved successfully',
    type: [QueueWithCustomerResponseDto],
    schema: {
      example: [
        {
          id: 'queue-123',
          sessionId: 'session-456',
          customerId: 'customer-789',
          status: 'waiting',
          department: 'Personal',
          requestedOperatorId: 'operator-123',
          assignedOperatorId: null,
          supervisorId: 'supervisor-456',
          typebotData: {},
          customerDepartmentChoice: 'Personal',
          customerOperatorChoice: null,
          operatorAvailable: true,
          createdAt: '2024-01-15T10:30:00Z',
          typebotCompletedAt: '2024-01-15T10:35:00Z',
          assignedAt: null,
          completedAt: null,
          evolutionInstance: 'instance-1',
          typebotSessionUrl: 'https://typebot.io/session/123',
          metadata: {},
          customer: {
            id: 'customer-789',
            remoteJid: '5511999999999@s.whatsapp.net',
            pushName: 'John Doe',
            profilePicUrl: 'https://example.com/profile.jpg',
            email: 'john@example.com',
            cpf: '12345678901',
            cnpj: null,
            priority: 1,
            isGroup: false,
            isSaved: true,
            type: 'contact',
            status: 'active',
            createdAt: '2024-01-15T10:25:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          }
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have permission to access queues',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden',
        error: 'Forbidden'
      }
    }
  })
  @ApiSecurity('bearer')
  async getServiceUsers(@Request() req): Promise<QueueWithCustomer[]> {
    const userId = req.user.id;
    return this.queuesService.findServiceQueuesByUser(userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get all queues',
    description: `Retrieves all queues in the system with their associated customer information.
    Queues are ordered by creation date (newest first).
    
    This endpoint provides a complete view of all queue items regardless of status.`
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Queues retrieved successfully',
    type: [QueueWithCustomerResponseDto],
    schema: {
      example: [
        {
          id: 'queue-123',
          sessionId: 'session-456',
          customerId: 'customer-789',
          status: 'waiting',
          department: 'Personal',
          requestedOperatorId: 'operator-123',
          assignedOperatorId: null,
          supervisorId: 'supervisor-456',
          typebotData: {},
          customerDepartmentChoice: 'Personal',
          customerOperatorChoice: null,
          operatorAvailable: true,
          createdAt: '2024-01-15T10:30:00Z',
          typebotCompletedAt: '2024-01-15T10:35:00Z',
          assignedAt: null,
          completedAt: null,
          evolutionInstance: 'instance-1',
          typebotSessionUrl: 'https://typebot.io/session/123',
          metadata: {},
          customer: {
            id: 'customer-789',
            remoteJid: '5511999999999@s.whatsapp.net',
            pushName: 'John Doe',
            profilePicUrl: 'https://example.com/profile.jpg',
            email: 'john@example.com',
            cpf: '12345678901',
            cnpj: null,
            priority: 1,
            isGroup: false,
            isSaved: true,
            type: 'contact',
            status: 'active',
            createdAt: '2024-01-15T10:25:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          }
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiSecurity('bearer')
  async getAllQueues(): Promise<QueueWithCustomer[]> {
    return this.queuesService.findAllQueuesWithCustomers();
  }

  @Get('customer/:remoteJid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get queues by customer remoteJid',
    description: `Retrieves all queues for a specific customer identified by their remoteJid (WhatsApp phone number).
    Returns an array of queues with complete customer information.
    
    This endpoint is useful for finding all queue history for a specific customer,
    regardless of queue status. You can optionally filter by one or more queue statuses.`
  })
  @ApiParam({ 
    name: 'remoteJid', 
    description: 'WhatsApp phone number (remoteJid) of the customer',
    example: '5511999999999@s.whatsapp.net',
    type: 'string'
  })
  @ApiQuery({ 
    name: 'status', 
    enum: QueueStatus, 
    required: false, 
    isArray: true,
    description: 'Filter queues by one or more statuses. If not provided, returns all queues.',
    example: ['waiting', 'service']
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Queues retrieved successfully',
    type: [QueueWithCustomerResponseDto],
    schema: {
      example: [
        {
          id: 'queue-123',
          sessionId: 'session-456',
          customerId: 'customer-789',
          status: 'completed',
          department: 'Personal',
          requestedOperatorId: 'operator-123',
          assignedOperatorId: 'operator-123',
          supervisorId: 'supervisor-456',
          typebotData: {},
          customerDepartmentChoice: 'Personal',
          customerOperatorChoice: null,
          operatorAvailable: true,
          createdAt: '2024-01-15T10:30:00Z',
          typebotCompletedAt: '2024-01-15T10:35:00Z',
          assignedAt: '2024-01-15T10:40:00Z',
          completedAt: '2024-01-15T11:00:00Z',
          evolutionInstance: 'instance-1',
          typebotSessionUrl: 'https://typebot.io/session/123',
          metadata: {},
          customer: {
            id: 'customer-789',
            remoteJid: '5511999999999@s.whatsapp.net',
            pushName: 'John Doe',
            profilePicUrl: 'https://example.com/profile.jpg',
            email: 'john@example.com',
            cpf: '12345678901',
            cnpj: null,
            priority: 1,
            isGroup: false,
            isSaved: true,
            type: 'contact',
            status: 'active',
            createdAt: '2024-01-15T10:25:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          }
        }
      ]
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Customer not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Customer not found',
        error: 'Not Found'
      }
    }
  })
  @ApiSecurity('bearer')
  async getQueuesByRemoteJid(
    @Param('remoteJid') remoteJid: string, 
    @Query('status') status?: QueueStatus | QueueStatus[]
  ): Promise<QueueWithCustomer[]> {
    // Convert single status to array or handle multiple statuses
    let statuses: QueueStatus[] | undefined;
    
    if (status) {
      if (Array.isArray(status)) {
        statuses = status;
      } else {
        statuses = [status];
      }
    }
    
    return this.queuesService.findQueuesByRemoteJid(remoteJid, statuses);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get queue by ID',
    description: `Retrieves a specific queue by its unique identifier.
    Returns complete queue information including associated customer data.
    
    Use this endpoint to get detailed information about a specific queue item.`
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Unique identifier of the queue',
    example: 'queue-123',
    type: 'string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue retrieved successfully',
    type: QueueWithCustomerResponseDto,
    schema: {
      example: {
        id: 'queue-123',
        sessionId: 'session-456',
        customerId: 'customer-789',
        status: 'waiting',
        department: 'Personal',
        requestedOperatorId: 'operator-123',
        assignedOperatorId: null,
        supervisorId: 'supervisor-456',
        typebotData: {},
        customerDepartmentChoice: 'Personal',
        customerOperatorChoice: null,
        operatorAvailable: true,
        createdAt: '2024-01-15T10:30:00Z',
        typebotCompletedAt: '2024-01-15T10:35:00Z',
        assignedAt: null,
        completedAt: null,
        evolutionInstance: 'instance-1',
        typebotSessionUrl: 'https://typebot.io/session/123',
        metadata: {},
        customer: {
          id: 'customer-789',
          remoteJid: '5511999999999@s.whatsapp.net',
          pushName: 'John Doe',
          profilePicUrl: 'https://example.com/profile.jpg',
          email: 'john@example.com',
          cpf: '12345678901',
          cnpj: null,
          priority: 1,
          isGroup: false,
          isSaved: true,
          type: 'contact',
          status: 'active',
          createdAt: '2024-01-15T10:25:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Queue not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Queue not found',
        error: 'Not Found'
      }
    }
  })
  @ApiSecurity('bearer')
  async getQueueById(@Param('id') id: string): Promise<QueueWithCustomer | null> {
    return this.queuesService.findQueueWithCustomer(id);
  }

  @Post(':id/start-service')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Start queue service',
    description: `Starts service for a specific queue by ID.
    This endpoint assigns the authenticated operator to a waiting queue and changes its status to 'service'.
    
    The queue must be in 'waiting' status and not already assigned to another operator.
    
    Additionally, this endpoint will pause the typebot session to prevent conflicts during human operator interaction.`
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Unique identifier of the queue to start service',
    example: 'queue-123',
    type: 'string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue service started successfully',
    type: QueueWithCustomerResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Queue is not in waiting status or already assigned',
    schema: {
      example: {
        statusCode: 400,
        message: 'Queue is not in waiting status',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Queue not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Queue not found',
        error: 'Not Found'
      }
    }
  })
  async startQueueService(@Param('id') id: string, @Request() req): Promise<QueueWithCustomer | null> {
    const operator = req.user;
    
    try {
      const result = await this.queuesService.startQueueService(id, operator);
      
      if (!result) {
        throw new NotFoundException('Queue not found');
      }
      
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      if (error.message === 'Queue is not in waiting status' || 
          error.message === 'Queue is already assigned to an operator') {
        throw new BadRequestException(error.message);
      }
      
      throw error;
    }
  }

  @Post('answer-queue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Start service for most recent waiting queue',
    description: `Automatically starts service for the most recent waiting queue entry for the authenticated operator.
    This endpoint finds the most recent waiting queue (based on createdAt timestamp) that the operator can handle
    and assigns it to them, changing its status to 'service'.
    
    The queue must be in 'waiting' status and not already assigned to another operator.
    The operator must be either the requested operator or supervisor for the queue.
    
    Additionally, this endpoint will pause the typebot session to prevent conflicts during human operator interaction.`
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Most recent queue service started successfully',
    type: QueueWithCustomerResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - No waiting queues available or queue already assigned',
    schema: {
      example: {
        statusCode: 400,
        message: 'Queue is not in waiting status',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'No waiting queues found for this operator',
    schema: {
      example: {
        statusCode: 404,
        message: 'No waiting queues found',
        error: 'Not Found'
      }
    }
  })
  async answerQueue(@Request() req): Promise<QueueWithCustomer | null> {
    const operatorId = req.user.id;
    
    try {
      const result = await this.queuesService.startMostRecentQueueService(operatorId);
      
      if (!result) {
        throw new NotFoundException('No waiting queues found for this operator');
      }
      
      return result;
    } catch (error) {
      console.log(error)
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      if (error.message === 'Queue is not in waiting status' || 
          error.message === 'Queue is already assigned to an operator') {
        throw new BadRequestException(error.message);
      }
      
      throw error;
    }
  }

  @Post(':id/complete-service')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Complete queue service',
    description: `Marks a queue as completed and sets the completion timestamp.
    This endpoint is used when an operator finishes handling a customer from the queue.
    
    The queue must be in 'service' status to be eligible for completion.
    
    This endpoint creates a tabulation record to track the service completion
    and will close the typebot session to enable future bot interactions for the customer.`
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Unique identifier of the queue to complete',
    example: 'queue-123',
    type: 'string'
  })
  @ApiBody({
    type: CompleteQueueServiceDto,
    description: 'Tabulation status sub category for this service completion',
    examples: {
      example1: {
        summary: 'Complete service with tabulation',
        value: {
          tabulationStatusSubId: 'tab-status-sub-123'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue service completed successfully',
    type: QueueWithCustomerResponseDto,
    schema: {
      example: {
        id: 'queue-123',
        sessionId: 'session-456',
        customerId: 'customer-789',
        status: 'waiting',
        department: 'Personal',
        requestedOperatorId: 'operator-123',
        assignedOperatorId: 'operator-123',
        supervisorId: 'supervisor-456',
        typebotData: {},
        customerDepartmentChoice: 'Personal',
        customerOperatorChoice: null,
        operatorAvailable: true,
        createdAt: '2024-01-15T10:30:00Z',
        typebotCompletedAt: '2024-01-15T10:35:00Z',
        assignedAt: '2024-01-15T10:40:00Z',
        completedAt: '2024-01-15T11:00:00Z',
        evolutionInstance: 'instance-1',
        typebotSessionUrl: 'https://typebot.io/session/123',
        metadata: {},
        customer: {
          id: 'customer-789',
          remoteJid: '5511999999999@s.whatsapp.net',
          pushName: 'John Doe',
          profilePicUrl: 'https://example.com/profile.jpg',
          email: 'john@example.com',
          cpf: '12345678901',
          cnpj: null,
          priority: 1,
          isGroup: false,
          isSaved: true,
          type: 'contact',
          status: 'active',
          createdAt: '2024-01-15T10:25:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Queue not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Queue not found',
        error: 'Not Found'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Queue is not in service status',
    schema: {
      example: {
        statusCode: 400,
        message: 'Queue is not in service status',
        error: 'Bad Request'
      }
    }
  })
  @ApiSecurity('bearer')
  async completeQueueService(@Param('id') id: string, @Body() completeQueueServiceDto: CompleteQueueServiceDto, @Request() req): Promise<QueueWithCustomer | null> {
    const operatorId = req.user.id;
    
    try {
      const result = await this.queuesService.completeQueueService(id, req.user, completeQueueServiceDto);
      
      if (!result) {
        throw new NotFoundException('Queue not found');
      }
      
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      if (error.message === 'Queue is not in service status' || 
          error.message === 'Only the assigned operator can complete this queue') {
        throw new BadRequestException(error.message);
      }
      
      throw error;
    }
  }

  @Post('outbound/:remoteJid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Start outbound conversation',
    description: `Initiates an outbound conversation with a customer by creating a new queue and sending an initial message.
    
    This endpoint creates a new queue with 'waiting' status and sends a welcome message to the customer
    introducing the operator from UNIDAS CONTABILIDADE.
    
    The operator data is extracted from the JWT token, and the system automatically sends:
    "Olá, aqui é o(a) [OPERATOR NAME] da UNIDAS CONTABILIDADE, tudo bem?"`
  })
  @ApiParam({ 
    name: 'remoteJid', 
    description: 'WhatsApp phone number (remoteJid) of the customer to start conversation with',
    example: '5511999999999@s.whatsapp.net',
    type: 'string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Outbound conversation started successfully',
    type: QueueWithCustomerResponseDto,
    schema: {
      example: {
        id: 'queue-123',
        sessionId: 'session-456',
        customerId: 'customer-789',
        status: 'waiting',
        department: 'Personal',
        requestedOperatorId: 'operator-123',
        assignedOperatorId: null,
        supervisorId: null,
        typebotData: {},
        customerDepartmentChoice: null,
        customerOperatorChoice: null,
        operatorAvailable: true,
        createdAt: '2024-01-15T10:30:00Z',
        typebotCompletedAt: null,
        assignedAt: null,
        completedAt: null,
        evolutionInstance: 'instance-1',
        typebotSessionUrl: null,
        metadata: {
          direction: 'outbound',
          initiatedBy: 'operator-123',
          initialMessage: 'Olá, aqui é o(a) João Silva da UNIDAS CONTABILIDADE, tudo bem?'
        },
        customer: {
          id: 'customer-789',
          remoteJid: '5511999999999@s.whatsapp.net',
          pushName: 'John Doe',
          profilePicUrl: 'https://example.com/profile.jpg',
          email: 'john@example.com',
          cpf: '12345678901',
          cnpj: null,
          priority: 1,
          isGroup: false,
          isSaved: true,
          type: 'contact',
          status: 'active',
          createdAt: '2024-01-15T10:25:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid remoteJid format or customer not found',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid remoteJid format or customer not found',
        error: 'Bad Request'
      }
    }
  })
  @ApiSecurity('bearer')
  async startOutboundConversation(
    @Param('remoteJid') remoteJid: string, 
    @Request() req
  ): Promise<QueueWithCustomer> {
    const operatorId = req.user.id;
    const operatorName = req.user.name || req.user.login || 'Operador';
    
    try {
      const result = await this.queuesService.startOutboundConversation(remoteJid, req.user);
      return result;
    } catch (error) {
      if (error.message === 'Numero não encontrado no WhatsApp' || 
          error.message === 'Já existe uma atendimento iniciado para este número') {
        throw new BadRequestException(error.message);
      }
      
      throw error;
    }
  }

  @Post(':id/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Transfer queue service to another operator',
    description: `Transfers a queue service from the current operator to another operator.
    
    This endpoint allows the currently assigned operator to transfer a queue to another operator.
    The queue must be in 'service' status and the current operator must be the assigned operator.
    
    Upon successful transfer:
    1. The queue is reassigned to the target operator
    2. A system message is sent to the customer: "Atendimento transferido para *[NEW OPERATOR NAME]*"
    3. A socket event (queue.transfer) is emitted to update the frontend
    
    The current operator information is extracted from the JWT token.`
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Unique identifier of the queue to transfer',
    example: 'queue-123',
    type: 'string'
  })
  @ApiBody({ 
    type: TransferQueueDto,
    description: 'Transfer request data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue transferred successfully',
    type: QueueWithCustomerResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Queue not in service status, already assigned, or target operator not found',
    schema: {
      example: {
        statusCode: 400,
        message: 'Queue is not in service status',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Queue not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Queue not found',
        error: 'Not Found'
      }
    }
  })
  @ApiSecurity('bearer')
  async transferQueueService(
    @Param('id') id: string, 
    @Body() transferQueueDto: TransferQueueDto,
    @Request() req
  ): Promise<QueueWithCustomer | null> {
    try {
      const result = await this.queuesService.transferQueueService(
        id, 
        req.user, 
        transferQueueDto.operatorId
      );
      
      if (!result) {
        throw new NotFoundException('Queue not found');
      }
      
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      if (error.message === 'Queue is not in service status' || 
          error.message === 'Only the assigned operator can transfer this queue' ||
          error.message === 'Target operator not found') {
        throw new BadRequestException(error.message);
      }
      
      throw error;
    }
  }

  @Get('history/:remoteJid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get conversation history by customer remoteJid',
    description: `Retrieves the complete conversation history for a customer based on their remoteJid (WhatsApp phone number).
    
    This endpoint finds all completed or cancelled queues for the customer and optionally retrieves all associated messages
    and operator information for each session, ordered by sentAt timestamp. The history is organized by queue sessions, 
    with the most recent sessions first.
    
    The response includes:
    - Queue information with customer details
    - Operator information (requested operator, assigned operator, supervisor) - controlled by 'operators' flag
    - Messages for each session - controlled by 'messages' flag
    
    Use the query parameters to control what information is included:
    - 'messages': Include message content (default: true)
    - 'operators': Include operator information (default: true)
    
    This is useful for operators to review previous conversations with a customer before starting a new service.`
  })
  @ApiParam({ 
    name: 'remoteJid', 
    description: 'WhatsApp phone number (remoteJid) of the customer',
    example: '5511999999999@s.whatsapp.net',
    type: 'string'
  })
  @ApiQuery({ 
    name: 'messages', 
    required: false, 
    description: 'Include message content in the response (default: true)',
    type: 'boolean',
    example: true
  })
  @ApiQuery({ 
    name: 'operators', 
    required: false, 
    description: 'Include operator information in the response (default: true)',
    type: 'boolean',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversation history retrieved successfully',
    type: [ConversationHistoryItemDto]
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Customer not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Customer not found',
        error: 'Not Found'
      }
    }
  })
  @ApiSecurity('bearer')
  async getConversationHistory(
    @Param('remoteJid') remoteJid: string,
    @Query('messages') messages?: boolean,
    @Query('operators') operators?: boolean
  ): Promise<Array<{
    queue: QueueWithCustomer;
    messages?: any[];
    operators?: {
      requestedOperator?: any;
      assignedOperator?: any;
      supervisor?: any;
    };
  }>> {
    // Default to true if not specified
    const includeMessages = messages !== false;
    const includeOperators = operators !== false;
    return this.queuesService.getConversationHistory(remoteJid, includeMessages, includeOperators);
  }
} 