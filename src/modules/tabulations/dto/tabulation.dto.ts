import { ApiProperty } from '@nestjs/swagger';

export class TabulationResponseDto {
  @ApiProperty({ description: 'Unique identifier for the tabulation', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Session ID reference', example: '123e4567-e89b-12d3-a456-426614174000' })
  sessionId: string;

  @ApiProperty({ description: 'User ID who performed the tabulation', example: '123e4567-e89b-12d3-a456-426614174000' })
  tabulatedBy: string;

  @ApiProperty({ description: 'Timestamp when tabulation was performed', example: '2024-01-01T00:00:00.000Z' })
  tabulatedAt: Date;

  @ApiProperty({ description: 'Tabulation status sub ID reference', example: '123e4567-e89b-12d3-a456-426614174000' })
  tabulationId: string;
}
