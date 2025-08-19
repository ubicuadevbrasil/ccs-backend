import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Department, QueueDirection } from '../../queues/interfaces/queue.interface';

export class DashboardCardsDto {
  @ApiPropertyOptional({
    description: 'Filter metrics by department',
    enum: Department,
    example: Department.PERSONAL,
  })
  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @ApiPropertyOptional({
    description: 'Start date in ISO format (YYYY-MM-DD). If not provided, current day is used.',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format (YYYY-MM-DD). If not provided, current day is used.',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class DashboardTabulationsDto {
  @ApiPropertyOptional({
    description: 'Filter by start date in ISO format (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date in ISO format (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer name (partial match)',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer phone number',
    example: '5511999999999',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer CPF',
    example: '12345678901',
  })
  @IsOptional()
  @IsString()
  customerCpf?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer email (partial match)',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Filter by queue direction',
    enum: QueueDirection,
    example: QueueDirection.INBOUND,
  })
  @IsOptional()
  @IsEnum(QueueDirection)
  direction?: QueueDirection;

  @ApiPropertyOptional({
    description: 'Filter by tabulation status ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  tabulationStatus?: string;
}
