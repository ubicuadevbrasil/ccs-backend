import { ApiProperty } from '@nestjs/swagger';

export class QueueItemDto {
  @ApiProperty({
    description: 'Session identifier',
    example: 'session_whatsapp_123456789',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Customer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  customerId: string;

  @ApiProperty({
    description: 'Customer information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      contact: '+5511999999999',
      platform: 'whatsapp',
    },
  })
  customer: {
    id: string;
    name?: string;
    pushName?: string;
    contact?: string;
    platform?: string;
    profilePicUrl?: string;
  };
}

export class WaitingQueueResponseDto {
  @ApiProperty({
    description: 'List of waiting customers',
    type: [QueueItemDto],
  })
  data: QueueItemDto[];

  @ApiProperty({
    description: 'Total number of waiting customers',
    example: 5,
  })
  total: number;
}

