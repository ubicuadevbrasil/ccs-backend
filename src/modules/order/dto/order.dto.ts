import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID, IsObject, IsDateString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsString()
  orderStatus: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  orderDetails?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originOrdered?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  segment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  grossValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  netValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  billedValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dateOrder?: string;
}

export class UpdateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderStatus?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  orderDetails?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originOrdered?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  segment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  grossValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  netValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  billedValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dateOrder?: string;
}

export class UpdateOrderByIdDto extends UpdateOrderDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class FindOrderDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  segment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  orderStatus: string;

  @ApiProperty({ type: Object, required: false })
  orderDetails?: Record<string, unknown> | null;

  @ApiProperty({ required: false })
  originOrdered?: string | null;

  @ApiProperty({ required: false })
  segment?: string | null;

  @ApiProperty({ required: false })
  grossValue?: number | null;

  @ApiProperty({ required: false })
  netValue?: number | null;

  @ApiProperty({ required: false })
  billedValue?: number | null;

  @ApiProperty({ required: false })
  sessionId?: string | null;

  @ApiProperty({ required: false })
  dateOrder?: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}


