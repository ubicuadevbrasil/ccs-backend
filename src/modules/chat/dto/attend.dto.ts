import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendDto {
  @ApiPropertyOptional({
    description: 'Session identifier for specific customer to attend. If not provided, the oldest waiting customer will be attended.',
    example: 'session_whatsapp_123456789',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sessionId?: string;
}

export class AttendResponseDto {
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
    description: 'User ID who started the service',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  userName: string;

  @ApiProperty({
    description: 'Service started message sent to customer',
    example: '*John Doe* iniciou o atendimento',
  })
  attendMessage: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Service started successfully',
  })
  message: string;
}

