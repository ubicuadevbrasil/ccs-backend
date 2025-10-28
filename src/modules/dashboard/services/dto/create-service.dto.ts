import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUrl } from 'class-validator';

/**
 * DTO for creating a new service
 */
export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsUrl()
  endpoint?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
