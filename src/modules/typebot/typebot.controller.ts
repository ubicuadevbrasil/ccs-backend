import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { TypebotService } from './typebot.service';
import { TypebotAuthService } from './typebot-auth.service';
import { TypebotAuthGuard } from '../auth/guards/typebot-auth.guard';
import { SchedulerService } from '../scheduler/scheduler.service';
import type { 
  TypebotOperator, 
  TypebotOperatorStatus, 
  TypebotSessionStatus,
  GetOperatorsDto,
  CheckOperatorStatusDto,
  UpdateSessionStatusDto,
  ProcessChosenOperatorDto,
  CheckActiveQueueDto
} from './interfaces/typebot.interface';

@Controller('typebot')
@ApiTags('Typebot')
export class TypebotController {
  constructor(
    private readonly typebotService: TypebotService,
    private readonly typebotAuthService: TypebotAuthService,
    private readonly schedulerService: SchedulerService
  ) {}

  @Get('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Typebot API token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the non-expiring API token for Typebot authentication',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'The API token' },
        message: { type: 'string', description: 'Usage instructions' }
      }
    }
  })
  async getToken(): Promise<{ token: string; message: string }> {
    const token = this.typebotAuthService.generateToken();
    return {
      token,
      message: 'This token never expires and should be used for Typebot authentication'
    };
  }

  @Get('operators')
  @UseGuards(TypebotAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Typebot-API-Key')
  @ApiOperation({ summary: 'Get operators by department' })
  @ApiQuery({ name: 'department', description: 'Department name', example: 'Personal' })
  @ApiQuery({ name: 'remoteJid', description: 'Customer phone number (optional)', example: '5511999999999@s.whatsapp.net', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Message with operators list for Typebot',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Formatted message for Typebot' },
        operators: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              login: { type: 'string' },
              email: { type: 'string' },
              contact: { type: 'string' },
              profilePicture: { type: 'string' },
              status: { type: 'string' },
              profile: { type: 'string' },
              department: { type: 'string' },
              isOnline: { type: 'boolean' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  async getOperatorsByDepartment(
    @Query() query: GetOperatorsDto
  ): Promise<{ message: string; operators: TypebotOperator[] }> {
    return this.typebotService.getOperatorsByDepartment(query);
  }

  @Post('operator/status')
  @UseGuards(TypebotAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Typebot-API-Key')
  @ApiOperation({ summary: 'Check operator online status' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        operatorId: { type: 'string', description: 'Operator ID' }
      },
      required: ['operatorId']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Operator status information',
    schema: {
      type: 'object',
      properties: {
        operatorId: { type: 'string' },
        isOnline: { type: 'boolean' },
        lastSeen: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'Operator not found' })
  async checkOperatorStatus(
    @Body() dto: CheckOperatorStatusDto
  ): Promise<TypebotOperatorStatus> {
    return this.typebotService.checkOperatorStatus(dto);
  }

  @Put('session/status')
  @UseGuards(TypebotAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Typebot-API-Key')
  @ApiOperation({ summary: 'Update session and queue status' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID (optional if remoteJid is provided)' },
        remoteJid: { type: 'string', description: 'Customer phone number (optional if sessionId is provided)', example: '5511999999999@s.whatsapp.net' },
        status: { 
          type: 'string', 
          enum: ['active', 'waiting', 'completed', 'cancelled'],
          description: 'Session status'
        },
        operatorId: { type: 'string', description: 'Operator ID (optional)' },
        department: { type: 'string', description: 'Department (optional)' }
      },
      required: ['status']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session status updated successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        queueId: { type: 'string' },
        status: { type: 'string' },
        operatorId: { type: 'string' },
        department: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Invalid status or operator or missing sessionId/remoteJid' })
  async updateSessionStatus(
    @Body() dto: UpdateSessionStatusDto
  ): Promise<TypebotSessionStatus> {
    return this.typebotService.updateSessionStatus(dto);
  }

  @Post('operator/process')
  @UseGuards(TypebotAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Typebot-API-Key')
  @ApiOperation({ summary: 'Process chosen operator and assign to queue' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID (optional if remoteJid is provided)' },
        remoteJid: { type: 'string', description: 'Customer phone number (optional if sessionId is provided)', example: '5511999999999@s.whatsapp.net' },
        operatorPosition: { type: 'number', description: 'Position of chosen operator (1-based index)' }
      },
      required: ['operatorPosition']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Operator processed and assigned successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Response message for user' },
        assignedTo: { type: 'string', description: 'ID of assigned operator/supervisor' },
        isOnline: { type: 'boolean', description: 'Whether the chosen operator is online' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Invalid operator position or missing sessionId/remoteJid' })
  async processChosenOperator(
    @Body() dto: ProcessChosenOperatorDto
  ): Promise<{ message: string; assignedTo: string | undefined; isOnline: boolean }> {
    return this.typebotService.processChosenOperator(dto);
  }

  @Post('queue/check-active')
  @UseGuards(TypebotAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Typebot-API-Key')
  @ApiOperation({ summary: 'Check if customer has an active queue' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        remoteJid: { 
          type: 'string', 
          description: 'Customer phone number', 
          example: '5511999999999@s.whatsapp.net' 
        }
      },
      required: ['remoteJid']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Active queue status checked successfully',
    schema: {
      type: 'object',
      properties: {
        hasActiveQueue: { type: 'boolean', description: 'Whether customer has an active queue' },
        queue: { 
          type: 'object', 
          description: 'Queue details if active queue exists',
          properties: {
            id: { type: 'string' },
            sessionId: { type: 'string' },
            status: { type: 'string' },
            department: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  async checkActiveQueue(
    @Body() dto: CheckActiveQueueDto
  ): Promise<{ hasActiveQueue: boolean; queue?: any }> {
    console.log(dto)
    return this.typebotService.checkActiveQueue(dto);
  }

  @Post('cleanup/inactive-sessions')
  @UseGuards(TypebotAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Typebot-API-Key')
  @ApiOperation({ summary: 'Manually trigger cleanup of inactive typebot sessions' })
  @ApiResponse({ status: 200, description: 'Cleanup process started successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  async triggerInactiveSessionsCleanup() {
    return this.schedulerService.handleInactiveTypebotSessions();
  }
} 