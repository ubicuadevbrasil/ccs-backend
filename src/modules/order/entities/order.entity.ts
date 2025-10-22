export interface OrderEntity {
  id: string;
  orderId: string;
  orderStatus: string;
  orderDetails?: Record<string, unknown> | null;
  originOrdered?: string | null;
  segment?: string | null;
  grossValue?: number | null;
  netValue?: number | null;
  billedValue?: number | null;
  sessionId?: string | null;
  dateOrder?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Order implements OrderEntity {
  id: string;
  orderId: string;
  orderStatus: string;
  orderDetails?: Record<string, unknown> | null;
  originOrdered?: string | null;
  segment?: string | null;
  grossValue?: number | null;
  netValue?: number | null;
  billedValue?: number | null;
  sessionId?: string | null;
  dateOrder?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Order>) {
    Object.assign(this, partial);
  }

  toResponseDto(): any {
    return {
      id: this.id,
      orderId: this.orderId,
      orderStatus: this.orderStatus,
      orderDetails: this.orderDetails,
      originOrdered: this.originOrdered,
      segment: this.segment,
      grossValue: this.grossValue,
      netValue: this.netValue,
      billedValue: this.billedValue,
      sessionId: this.sessionId,
      dateOrder: this.dateOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}


