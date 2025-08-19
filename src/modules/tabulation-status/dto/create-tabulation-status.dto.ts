import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTabulationStatusDto {
  @ApiProperty({ description: 'Description of the tabulation status', example: 'Completed' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
