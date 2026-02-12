import { IsString, IsNotEmpty, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatEndServiceDto {
  @ApiProperty({
    description: 'Session identifier for the chat to end',
    example: 'session_whatsapp_123456789',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  sessionId: string;

  @ApiProperty({
    description: 'Tabulation ID for categorizing the service',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  tabulationId: string;

  @ApiPropertyOptional({
    description: 'Internal notes/observations about the interaction',
    example: 'Customer was very satisfied with the service',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;

  @ApiPropertyOptional({
    description: 'Donor code for the interaction',
    example: 'DONOR123',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  donorCode?: string;
}

export class EndServiceResponseDto {
  @ApiProperty({
    description: 'Session identifier',
    example: 'session_whatsapp_123456789',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Tabulation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tabulationId: string;

  @ApiProperty({
    description: 'End service message sent to customer',
    example: '*John Doe* encerrou o atendimento',
  })
  endServiceMessage: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Service ended successfully',
  })
  message: string;
}

