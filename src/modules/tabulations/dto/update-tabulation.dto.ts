import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTabulationDto {
  @ApiProperty({ description: 'Tabulation status sub ID reference', example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  @IsUUID()
  @IsOptional()
  tabulationId?: string;
}
