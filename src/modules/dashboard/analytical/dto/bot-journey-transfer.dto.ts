import { IsOptional, IsDateString } from 'class-validator';

/**
 * DTO for bot journey transfer analytics request
 */
export class BotJourneyTransferDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

