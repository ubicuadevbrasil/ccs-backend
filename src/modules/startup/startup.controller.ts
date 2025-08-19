import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StartupService } from './startup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Startup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('startup')
export class StartupController {
  constructor(private readonly startupService: StartupService) {}

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get startup status and configured instance' })
  @ApiResponse({ status: 200, description: 'Startup status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStartupStatus(): Promise<any> {
    return this.startupService.getStartupStatus();
  }

  @Post('sync-groups')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually sync groups from Evolution API using configured instance' })
  @ApiResponse({ status: 200, description: 'Groups synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async syncAllGroups(): Promise<any> {
    return this.startupService.syncGroups();
  }

  @Post('sync-groups/:instance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually sync groups for specific instance' })
  @ApiParam({ name: 'instance', description: 'Evolution API instance name' })
  @ApiResponse({ status: 200, description: 'Groups synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async syncGroupsForInstance(@Param('instance') instance: string): Promise<any> {
    return this.startupService.syncGroups(instance);
  }
} 