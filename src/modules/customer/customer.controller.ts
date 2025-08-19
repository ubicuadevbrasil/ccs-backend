import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { CustomerEntity } from './dto/customer.entity';
import { Customer } from './interfaces/customer.interface';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Customer created successfully',
    type: CustomerEntity 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid customer data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async create(@Body() createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.customerService.create(createCustomerDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple customers in bulk' })
  @ApiBody({ type: [CreateCustomerDto] })
  @ApiResponse({ 
    status: 201, 
    description: 'Customers created successfully',
    type: [CustomerEntity] 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid customer data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async createBulk(@Body() customersData: CreateCustomerDto[]): Promise<Customer[]> {
    return this.customerService.bulkUpsert(customersData);
  }

  @Post('from-whatsapp')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create customer from WhatsApp contact data' })
  @ApiBody({ description: 'WhatsApp contact data' })
  @ApiResponse({ 
    status: 201, 
    description: 'Customer created from WhatsApp contact',
    type: CustomerEntity 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid contact data or groups not allowed' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async createFromWhatsApp(@Body() contactData: any): Promise<Customer> {
    return this.customerService.createFromWhatsAppContact(contactData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with optional filters' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by contact type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by customer status' })
  @ApiQuery({ name: 'isGroup', required: false, description: 'Filter by group status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of customers retrieved successfully',
    type: [CustomerEntity] 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('isGroup') isGroup?: boolean,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<Customer[]> {
    return this.customerService.findAll({
      type,
      status,
      isGroup,
      limit,
      offset,
    });
  }

  @Get('search')
  @ApiOperation({ summary: 'Search customers by name, email, CPF, or CNPJ' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiQuery({ name: 'instanceId', required: false, description: 'Filter by instance ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results retrieved successfully',
    type: [CustomerEntity] 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async search(
    @Query('q') searchTerm: string,
    @Query('instanceId') instanceId?: string,
  ): Promise<Customer[]> {
    return this.customerService.searchCustomers(searchTerm, instanceId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active customers only' })
  @ApiQuery({ name: 'instanceId', required: false, description: 'Filter by instance ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Active customers retrieved successfully',
    type: [CustomerEntity] 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async getActiveCustomers(@Query('instanceId') instanceId?: string): Promise<Customer[]> {
    return this.customerService.getActiveCustomers(instanceId);
  }

  @Get('priority')
  @ApiOperation({ summary: 'Get customers by priority level' })
  @ApiQuery({ name: 'remoteJid', required: false, description: 'Filter by remote JID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Priority customers retrieved successfully',
    type: [CustomerEntity] 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async getCustomersByPriority(@Query('remoteJid') remoteJid?: string): Promise<Customer[]> {
    return this.customerService.getCustomersByPriority(remoteJid || '');
  }

  @Get('count')
  @ApiOperation({ summary: 'Count customers by remote JID' })
  @ApiQuery({ name: 'remoteJid', required: true, description: 'Remote JID to count' })
  @ApiResponse({ 
    status: 200, 
    description: 'Customer count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: 'Number of customers' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async countByRemoteJid(@Query('remoteJid') remoteJid: string): Promise<{ count: number }> {
    const count = await this.customerService.countByRemoteJid(remoteJid);
    return { count };
  }

  @Get('customer/:remoteJid')
  @ApiOperation({ summary: 'Find customer by remote JID' })
  @ApiParam({ name: 'remoteJid', description: 'WhatsApp remote JID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Customer found successfully',
    type: CustomerEntity 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Customer not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async findByRemoteJid(@Param('remoteJid') remoteJid: string): Promise<Customer | null> {
    return this.customerService.findByRemoteJid(remoteJid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Customer found successfully',
    type: CustomerEntity 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Customer not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async findOne(@Param('id') id: string): Promise<Customer> {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Customer updated successfully',
    type: CustomerEntity 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Customer not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid update data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Patch('remote/:remoteJid')
  @ApiOperation({ summary: 'Update customer by remote JID' })
  @ApiParam({ name: 'remoteJid', description: 'WhatsApp remote JID' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Customer updated successfully',
    type: CustomerEntity 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Customer not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid update data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async updateByRemoteJid(
    @Param('remoteJid') remoteJid: string,
    @Body() updateData: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customerService.updateByRemoteJid(remoteJid, updateData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ 
    status: 204, 
    description: 'Customer deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Customer not found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.customerService.remove(id);
  }
} 