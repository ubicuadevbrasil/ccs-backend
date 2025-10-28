import { IsOptional, IsDateString, IsIn } from 'class-validator';

/**
 * DTO for services channel period analytics request
 */
export class ServicesChannelPeriodDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['month', '30days'])
  view?: 'month' | '30days' = 'month';
}
