import { ApiProperty } from '@nestjs/swagger';

export class TabulationStatusResponseDto {
  @ApiProperty({ description: 'Unique identifier for the tabulation status', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Description of the tabulation status', example: 'Completed Successfully' })
  description: string;

  @ApiProperty({ description: 'Whether the status is active', example: true })
  active: boolean;
}
