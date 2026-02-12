import { IsString, IsNotEmpty, IsUUID, IsOptional, IsArray, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartServiceDto {
  @ApiProperty({
    description: 'Customer ID to start service for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'Template code for HSM message',
    example: 'welcome_template',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  templateCode: string;

  @ApiPropertyOptional({
    description: 'Template parameters to interpolate in the message',
    type: [String],
    example: ['John', 'Doe'],
  })
  @IsOptional()
  @IsString({ each: true })
  parameters?: string[];
}

export class StartServiceResponseDto {
  @ApiProperty({
    description: 'Session identifier created for the service',
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
    description: 'Template code used',
    example: 'welcome_template',
  })
  templateCode: string;

  @ApiProperty({
    description: 'HSM message sent successfully',
    example: true,
  })
  messageSent: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Service started successfully',
  })
  message: string;
}

