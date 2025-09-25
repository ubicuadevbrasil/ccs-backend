import { 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUUID, 
  IsArray,
  MinLength, 
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TabulationStatus } from '../entities/tabulation.entity';

export class CreateTabulationSubDto {
  @ApiProperty({
    description: 'Tabulation sub name',
    example: 'Sub Tabulation 1',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Tabulation sub description',
    example: 'Description for sub tabulation',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Tabulation sub status',
    enum: TabulationStatus,
    example: TabulationStatus.ACTIVE,
    default: TabulationStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TabulationStatus)
  status?: TabulationStatus;
}

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
    description: 'Tabulation subs',
    type: [CreateTabulationSubDto],
    example: [
      { name: 'Sub 1', description: 'First sub', status: 'active' },
      { name: 'Sub 2', description: 'Second sub', status: 'active' }
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTabulationSubDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  tabulationSubs?: CreateTabulationSubDto[];
}

export class UpdateTabulationSubDto {
  @ApiPropertyOptional({
    description: 'Tabulation sub name',
    example: 'Updated Sub Tabulation',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Tabulation sub description',
    example: 'Updated description for sub tabulation',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Tabulation sub status',
    enum: TabulationStatus,
    example: TabulationStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TabulationStatus)
  status?: TabulationStatus;
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
    description: 'Tabulation subs',
    type: [UpdateTabulationSubDto],
    example: [
      { name: 'Updated Sub 1', description: 'Updated first sub', status: 'active' },
      { name: 'Updated Sub 2', description: 'Updated second sub', status: 'active' }
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTabulationSubDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  tabulationSubs?: UpdateTabulationSubDto[];
}

export class TabulationSubResponseDto {
  @ApiProperty({
    description: 'Tabulation sub unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Parent tabulation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tabulationId: string;

  @ApiProperty({
    description: 'Tabulation sub name',
    example: 'Sub Tabulation 1',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Tabulation sub description',
    example: 'Description for sub tabulation',
  })
  description?: string;

  @ApiProperty({
    description: 'Tabulation sub status',
    enum: TabulationStatus,
    example: TabulationStatus.ACTIVE,
  })
  status: TabulationStatus;

  @ApiProperty({
    description: 'Tabulation sub creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Tabulation sub last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether tabulation sub is active',
    example: true,
  })
  isActive: boolean;
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
    description: 'Whether tabulation has subs',
    example: true,
  })
  hasSubs: boolean;

  @ApiProperty({
    description: 'Number of active subs',
    example: 2,
  })
  activeSubsCount: number;

  @ApiPropertyOptional({
    description: 'Tabulation subs',
    type: [TabulationSubResponseDto],
  })
  tabulationSubs?: TabulationSubResponseDto[];
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
    description: 'Tabulation subs',
    type: [UpdateTabulationSubDto],
    example: [
      { name: 'Updated Sub 1', description: 'Updated first sub', status: 'active' },
      { name: 'Updated Sub 2', description: 'Updated second sub', status: 'active' }
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTabulationSubDto)
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  tabulationSubs?: UpdateTabulationSubDto[];
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
