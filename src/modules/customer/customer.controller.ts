import {
  Controller,
  Get,
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
import { CustomerService } from './customer.service';
import { 
  CreateCustomerDto, 
  UpdateCustomerByIdDto, 
  CustomerQueryDto, 
  FindCustomerDto, 
  DeleteCustomerDto, 
  CustomerResponseDto 
} from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Customer } from './entities/customer.entity';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Patch('create')
  @ApiOperation({ summary: 'Create a new customer with tags' })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Customer with this platformId, email, CPF, or CNPJ already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.customerService.createCustomer(createCustomerDto);
    return customer.toResponseDto();
  }

  @Get('list')
  @ApiOperation({ summary: 'Get all customers with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  @ApiQuery({ name: 'platform', required: false, description: 'Filter by platform' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'isGroup', required: false, description: 'Filter by group contacts' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CustomerResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAllCustomers(@Query() query: CustomerQueryDto) {
    return this.customerService.findAllCustomers(query);
  }

  @Get('find')
  @ApiOperation({ summary: 'Find customer by ID' })
  @ApiQuery({ name: 'id', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer retrieved successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async findCustomerById(@Query() query: FindCustomerDto): Promise<CustomerResponseDto> {
    const customer = await this.customerService.findCustomerByIdWithTags(query.id);
    return customer.toResponseDto();
  }

  @Patch('update')
  @ApiOperation({ summary: 'Update customer by ID with tags' })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Customer with this platformId, email, CPF, or CNPJ already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async updateCustomer(@Body() updateCustomerDto: UpdateCustomerByIdDto): Promise<CustomerResponseDto> {
    const { id, ...updateData } = updateCustomerDto;
    const customer = await this.customerService.updateCustomer(id, updateData);
    return customer.toResponseDto();
  }

  @Delete('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete customer by ID' })
  @ApiResponse({
    status: 204,
    description: 'Customer deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async deleteCustomer(@Body() deleteCustomerDto: DeleteCustomerDto): Promise<void> {
    return this.customerService.deleteCustomer(deleteCustomerDto.id);
  }
}
