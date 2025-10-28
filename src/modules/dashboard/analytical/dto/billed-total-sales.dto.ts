import { IsOptional, IsDateString, IsIn } from 'class-validator';

/**
 * DTO for billed total sales analytics request
 */
export class BilledTotalSalesDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['month', '30days'])
  view?: 'month' | '30days' = 'month';

  @IsOptional()
  @IsIn(['whatsapp', 'chatweb'])
  origin?: 'whatsapp' | 'chatweb';
}

