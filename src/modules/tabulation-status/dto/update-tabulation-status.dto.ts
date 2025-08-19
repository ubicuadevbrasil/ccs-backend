import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTabulationStatusDto {
  @ApiProperty({ description: 'Description of the tabulation status', example: 'Completed Successfully', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
