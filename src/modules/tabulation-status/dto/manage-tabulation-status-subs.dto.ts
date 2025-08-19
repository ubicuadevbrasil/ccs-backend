import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum TabulationStatusSubAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export class CreateTabulationStatusSubItemDto {
  @ApiProperty({ description: 'Description of the tabulation status sub', example: 'Process completed successfully' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Whether the sub item is active', example: true, required: false, default: true })
  @IsOptional()
  active?: boolean;
}

export class UpdateTabulationStatusSubItemDto {
  @ApiProperty({ description: 'Tabulation status sub ID to update', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Description of the tabulation status sub', example: 'Process completed successfully' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Whether the sub item is active', example: true, required: false })
  @IsOptional()
  active?: boolean;
}

export class DeleteTabulationStatusSubItemDto {
  @ApiProperty({ description: 'Tabulation status sub ID to delete', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class ManageTabulationStatusSubsDto {
  @ApiProperty({ 
    description: 'Action to perform on tabulation status sub items', 
    enum: TabulationStatusSubAction,
    example: TabulationStatusSubAction.CREATE
  })
  @IsEnum(TabulationStatusSubAction)
  @IsNotEmpty()
  target: TabulationStatusSubAction;

  @ApiProperty({ 
    description: 'Array of items to process based on the target action', 
    type: [CreateTabulationStatusSubItemDto],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTabulationStatusSubItemDto)
  createItems?: CreateTabulationStatusSubItemDto[];

  @ApiProperty({ 
    description: 'Array of items to update', 
    type: [UpdateTabulationStatusSubItemDto],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTabulationStatusSubItemDto)
  updateItems?: UpdateTabulationStatusSubItemDto[];

  @ApiProperty({ 
    description: 'Array of item IDs to delete', 
    type: [DeleteTabulationStatusSubItemDto],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeleteTabulationStatusSubItemDto)
  deleteItems?: DeleteTabulationStatusSubItemDto[];
}
