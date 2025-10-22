import { Controller, Get, Post, Patch, Delete, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderByIdDto, FindOrderDto, OrderQueryDto, OrderResponseDto } from './dto/order.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const order = await this.orderService.createOrder(createOrderDto);
    return order.toResponseDto();
  }

  @Get('list')
  @ApiOperation({ summary: 'Get all orders with pagination and filtering' })
  async findAllOrders(@Query() query: OrderQueryDto) {
    return this.orderService.findAllOrders(query);
  }

  @Get('find')
  @ApiOperation({ summary: 'Find order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOrderById(@Query() query: FindOrderDto): Promise<OrderResponseDto> {
    const order = await this.orderService.findOrderById(query.id);
    return order.toResponseDto();
  }

  @Patch('update')
  @ApiOperation({ summary: 'Update order by ID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrder(@Body() updateOrderDto: UpdateOrderByIdDto): Promise<OrderResponseDto> {
    const { id, ...updateData } = updateOrderDto;
    const order = await this.orderService.updateOrder(id, updateData);
    return order.toResponseDto();
  }

  @Delete('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete order by ID' })
  @ApiResponse({ status: 204, description: 'Order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async deleteOrder(@Body() body: FindOrderDto): Promise<void> {
    return this.orderService.deleteOrder(body.id);
  }
}


