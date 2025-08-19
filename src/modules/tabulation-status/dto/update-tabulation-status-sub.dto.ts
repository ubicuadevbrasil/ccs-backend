import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTabulationStatusSubDto {
  @ApiProperty({ description: 'Tabulation status ID reference', example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsUUID()
  @IsOptional()
  tabulationStatusId?: string;

  @ApiProperty({ description: 'Description of the tabulation status sub', example: 'Process completed successfully', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
