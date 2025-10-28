import { IsOptional, IsDateString, IsIn } from 'class-validator';

/**
 * DTO for closure human bot analytics request
 */
export class ClosureHumanBotDto {
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

