import { ApiProperty } from '@nestjs/swagger';
import { TabulationStatusSubResponseDto } from './tabulation-status-sub.dto';

export class ManageTabulationStatusSubsResponseDto {
  @ApiProperty({ 
    description: 'Array of created tabulation status sub items',
    type: [TabulationStatusSubResponseDto],
    example: []
  })
  created: TabulationStatusSubResponseDto[];

  @ApiProperty({ 
    description: 'Array of updated tabulation status sub items',
    type: [TabulationStatusSubResponseDto],
    example: []
  })
  updated: TabulationStatusSubResponseDto[];

  @ApiProperty({ 
    description: 'Array of deleted tabulation status sub item IDs',
    type: [TabulationStatusSubResponseDto],
    example: []
  })
  deleted: TabulationStatusSubResponseDto[];
}
