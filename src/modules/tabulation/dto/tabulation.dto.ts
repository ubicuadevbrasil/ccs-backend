import { 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUUID, 
  IsArray,
  IsBoolean,
  MinLength, 
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TabulationStatus } from '../entities/tabulation.entity';

export class CreateTabulationDto {
  @ApiProperty({
    description: 'Tabulation name',
    example: 'Main Tabulation',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Tabulation description',
    example: 'Description for main tabulation',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Tabulation status',
    enum: TabulationStatus,
    example: TabulationStatus.ACTIVE,
    default: TabulationStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TabulationStatus)
  status?: TabulationStatus;

  @ApiPropertyOptional({
    description: 'Whether tabulation handles orders',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  orders?: boolean;
}

export class UpdateTabulationDto {
  @ApiPropertyOptional({
    description: 'Tabulation name',
    example: 'Updated Tabulation',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Tabulation description',
    example: 'Updated description for tabulation',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Tabulation status',
    enum: TabulationStatus,
    example: TabulationStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TabulationStatus)
  status?: TabulationStatus;

  @ApiPropertyOptional({
    description: 'Whether tabulation handles orders',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  orders?: boolean;
}

export class TabulationResponseDto {
  @ApiProperty({
    description: 'Tabulation unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Tabulation name',
    example: 'Main Tabulation',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Tabulation description',
    example: 'Description for main tabulation',
  })
  description?: string;

  @ApiProperty({
    description: 'Tabulation status',
    enum: TabulationStatus,
    example: TabulationStatus.ACTIVE,
  })
  status: TabulationStatus;

  @ApiProperty({
    description: 'Whether tabulation handles orders',
    example: false,
  })
  orders: boolean;

  @ApiProperty({
    description: 'Tabulation creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Tabulation last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether tabulation is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether tabulation has description',
    example: true,
  })
  hasDescription: boolean;

  @ApiProperty({
    description: 'Whether tabulation handles orders',
    example: true,
  })
  hasOrders: boolean;j
}

export class TabulationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Search term for name or description',
    example: 'main',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by tabulation status',
    enum: TabulationStatus,
    example: TabulationStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TabulationStatus)
  status?: TabulationStatus;
}

export class FindTabulationDto {
  @ApiProperty({
    description: 'Tabulation unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class UpdateTabulationByIdDto {
  @ApiProperty({
    description: 'Tabulation unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    description: 'Tabulation name',
    example: 'Updated Tabulation',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Tabulation description',
    example: 'Updated description for tabulation',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Tabulation status',
    enum: TabulationStatus,
    example: TabulationStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TabulationStatus)
  status?: TabulationStatus;

  @ApiPropertyOptional({
    description: 'Whether tabulation handles orders',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  orders?: boolean;
}

export class DeleteTabulationDto {
  @ApiProperty({
    description: 'Tabulation unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
