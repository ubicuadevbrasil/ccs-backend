import { IsString, IsNotEmpty, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferChatDto {
  @ApiProperty({
    description: 'Session identifier for the chat to transfer',
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
    description: 'ID of the user to transfer the chat to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}

export class TransferChatResponseDto {
  @ApiProperty({
    description: 'Session identifier',
    example: 'session_whatsapp_123456789',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Previous user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  previousUserId: string;

  @ApiProperty({
    description: 'New user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  newUserId: string;

  @ApiProperty({
    description: 'New user name',
    example: 'John Doe',
  })
  newUserName: string;

  @ApiProperty({
    description: 'Transfer message sent to customer',
    example: 'Atendimento transferido para *John Doe*',
  })
  transferMessage: string;
}

