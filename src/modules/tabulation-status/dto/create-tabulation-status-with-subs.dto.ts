import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTabulationStatusDto } from './create-tabulation-status.dto';

export class CreateTabulationStatusSubItemDto {
  @ApiProperty({ description: 'Description of the tabulation status sub', example: 'Process completed successfully' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Whether the sub item is active', example: true, required: false, default: true })
  @IsOptional()
  active?: boolean;
}

export class CreateTabulationStatusWithSubsDto extends CreateTabulationStatusDto {
  @ApiProperty({ 
    description: 'Array of tabulation status sub items to create', 
    type: [CreateTabulationStatusSubItemDto],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTabulationStatusSubItemDto)
  subItems?: CreateTabulationStatusSubItemDto[];
}
