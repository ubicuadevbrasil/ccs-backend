import { IsOptional, IsDateString, IsIn } from 'class-validator';

/**
 * DTO for servicesChannel analytics request
 */
export class ServicesChannelDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['1d', '7d', '30d', '90d', '1y'])
  period?: string;
}
