import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { GetServicesDto } from './dto/get-services.dto';
import { ServiceStatsDto } from './dto/service-stats.dto';

/**
 * Controller for handling services dashboard operations
 */
@Controller('dashboard/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /**
   * Get all services with optional filtering
   */
  @Get()
  async getServices(@Query() query: GetServicesDto): Promise<any> {
    return this.servicesService.getServices(query);
  }

  /**
   * Get service statistics
   */
  @Get('stats')
  async getServiceStats(): Promise<ServiceStatsDto> {
    return this.servicesService.getServiceStats();
  }

  /**
   * Get a specific service by ID
   */
  @Get(':id')
  async getServiceById(@Param('id') id: string): Promise<any> {
    return this.servicesService.getServiceById(id);
  }

  /**
   * Create a new service
   */
  @Post()
  async createService(@Body() createServiceDto: CreateServiceDto): Promise<any> {
    return this.servicesService.createService(createServiceDto);
  }

  /**
   * Update an existing service
   */
  @Put(':id')
  async updateService(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<any> {
    return this.servicesService.updateService(id, updateServiceDto);
  }

  /**
   * Delete a service
   */
  @Delete(':id')
  async deleteService(@Param('id') id: string): Promise<any> {
    return this.servicesService.deleteService(id);
  }

  /**
   * Get service usage analytics
   */
  @Get(':id/analytics')
  async getServiceAnalytics(@Param('id') id: string): Promise<any> {
    return this.servicesService.getServiceAnalytics(id);
  }
}
