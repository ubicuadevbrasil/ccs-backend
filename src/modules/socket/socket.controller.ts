import { Controller, Get, Param, Logger, Query, UseGuards, Post, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SocketService } from './socket.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetOperatorsQueryDto } from './dto/socket.dto';
import type { AuthenticatedUser } from './dto/socket.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DisconnectUserDto } from './dto/socket.dto';

@ApiTags('Socket')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('socket')
export class SocketController {
  private readonly logger = new Logger(SocketController.name);

  constructor(
    private readonly socketService: SocketService,
  ) {}

  /**
   * Get all connected users (operators) with optional department filter
   */
  @Get('operators')
  @ApiOperation({ 
    summary: 'Get connected operators',
    description: 'Retrieve all currently connected operators with optional department filtering'
  })
  @ApiQuery({ 
    name: 'department', 
    required: false, 
    description: 'Filter operators by department',
    enum: ['Personal', 'Fiscal', 'Accounting', 'Financial']
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Operators retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        operators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              socketId: { type: 'string' },
              operatorId: { type: 'string' },
              operatorName: { type: 'string' },
              department: { type: 'string' },
              isAvailable: { type: 'boolean' },
              connectedAt: { type: 'string', format: 'date-time' },
              lastActivity: { type: 'string', format: 'date-time' }
            }
          }
        },
        count: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  getConnectedOperators(@Query() query: GetOperatorsQueryDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`User ${user.name} (${user.id}) requested connected operators${query.department ? ` for department: ${query.department}` : ''}`);
    
    const { department } = query;
    
    let operators;
    if (department) {
      operators = this.socketService.getAvailableOperatorsByDepartment(department);
    } else {
      operators = this.socketService.getConnectedOperators();
    }
    
    return {
      operators,
      count: operators.length,
      timestamp: new Date(),
      ...(department && { department })
    };
  }

  /**
   * Check if a specific user (operator) is connected
   */
  @Get('operators/:operatorId/connected')
  @ApiOperation({ 
    summary: 'Check operator connection status',
    description: 'Verify if a specific operator is currently connected'
  })
  @ApiParam({ 
    name: 'operatorId', 
    description: 'Operator ID to check',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Connection status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        operatorId: { type: 'string' },
        isConnected: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  checkOperatorConnected(@Param('operatorId') operatorId: string, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`User ${user.name} (${user.id}) checked connection status for operator: ${operatorId}`);
    
    const operators = this.socketService.getConnectedOperators();
    const isConnected = operators.some(operator => operator.operatorId === operatorId);
    
    return {
      operatorId,
      isConnected,
      timestamp: new Date(),
    };
  }

  /**
   * Send disconnect event to a specific user
   */
  @Post('disconnect')
  @ApiOperation({ 
    summary: 'Send disconnect event to user',
    description: 'Send a disconnect event to a specific connected user (operator)'
  })
  @ApiBody({ 
    type: DisconnectUserDto,
    description: 'Disconnect request details'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Disconnect event sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        userId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'User not found or not connected' })
  sendDisconnectEvent(@Body() disconnectDto: DisconnectUserDto, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`User ${user.name} (${user.id}) requested disconnect for user: ${disconnectDto.userId}${disconnectDto.reason ? ` with reason: ${disconnectDto.reason}` : ''}`);
    
    const success = this.socketService.sendDisconnectEvent(disconnectDto.userId, user, disconnectDto.reason);
    
    if (!success) {
      throw new NotFoundException(`User ${disconnectDto.userId} not found or not connected`);
    }
    
    return {
      success: true,
      message: 'Disconnect event sent successfully',
      userId: disconnectDto.userId,
      timestamp: new Date(),
      ...(disconnectDto.reason && { reason: disconnectDto.reason })
    };
  }
} 