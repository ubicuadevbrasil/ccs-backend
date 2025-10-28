import { IsOptional, IsString, IsNumber, IsIn, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for getting WhatsApp messages with filtering
 */
export class GetMessagesDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @IsIn(['sent', 'received', 'failed', 'all'])
  status?: string = 'all';

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
