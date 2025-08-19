import { ApiProperty } from '@nestjs/swagger';

export class TabulationStatusSubResponseDto {
  @ApiProperty({ description: 'Unique identifier for the tabulation status sub', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Tabulation status ID reference', example: '123e4567-e89b-12d3-a456-426614174000' })
  tabulationStatusId: string;

  @ApiProperty({ description: 'Description of the tabulation status sub', example: 'Process completed successfully' })
  description: string;
}
