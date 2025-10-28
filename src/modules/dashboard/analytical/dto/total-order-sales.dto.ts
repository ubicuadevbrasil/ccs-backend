import { IsOptional, IsDateString, IsIn } from 'class-validator';

/**
 * DTO for total order sales analytics request
 */
export class TotalOrderSalesDto {
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

