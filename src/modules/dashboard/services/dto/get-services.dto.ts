import { IsOptional, IsString, IsNumber, IsIn, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for getting services with filtering
 */
export class GetServicesDto {
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
  @IsIn(['active', 'inactive', 'all'])
  status?: string = 'all';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
