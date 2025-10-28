import { IsOptional, IsDateString } from 'class-validator';

/**
 * DTO for bot journey steps analytics request
 */
export class BotJourneyStepsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

