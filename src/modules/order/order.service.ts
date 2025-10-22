import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { Order } from './entities/order.entity';
import { CreateOrderDto, OrderQueryDto, UpdateOrderDto } from './dto/order.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class OrderService {
  constructor(@InjectKnex() private readonly knex: Knex) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const [newOrder] = await this.knex('orders')
      .insert({
        ...createOrderDto,
        createdAt: this.knex.fn.now(),
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');
    return new Order(newOrder);
  }

  async findAllOrders(query: OrderQueryDto): Promise<PaginatedResult<Order>> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    let queryBuilder = this.knex('orders');

    if (query.search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .whereILike('orderId', `%${query.search}%`)
          .orWhereILike('orderStatus', `%${query.search}%`)
          .orWhereILike('segment', `%${query.search}%`)
          .orWhereILike('sessionId', `%${query.search}%`);
      });
    }

    if (query.orderStatus) {
      queryBuilder = queryBuilder.where('orderStatus', query.orderStatus);
    }

    if (query.segment) {
      queryBuilder = queryBuilder.where('segment', query.segment);
    }

    if (query.sessionId) {
      queryBuilder = queryBuilder.where('sessionId', query.sessionId);
    }

    const totalQuery = queryBuilder.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    const orders = await queryBuilder
      .select('*')
      .orderBy('dateOrder', 'desc')
      .limit(limit)
      .offset(offset);

    const orderEntities = orders.map((o) => new Order(o));

    return {
      data: orderEntities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOrderById(id: string): Promise<Order> {
    const order = await this.knex('orders').where('id', id).first();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return new Order(order);
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const existing = await this.knex('orders').where('id', id).first();
    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    const [updated] = await this.knex('orders')
      .where('id', id)
      .update({
        ...updateOrderDto,
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');
    return new Order(updated);
  }

  async deleteOrder(id: string): Promise<void> {
    const deleted = await this.knex('orders').where('id', id).del();
    if (deleted === 0) {
      throw new NotFoundException('Order not found');
    }
  }
}


