import { ApiProperty } from '@nestjs/swagger';
import { MessageTemplateType } from '../interfaces/message-template.interface';

export class MessageTemplateResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the message template',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  id: string;

  @ApiProperty({
    description: 'The message content of the template',
    example: '¡Hola! Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte hoy?'
  })
  message: string;

  @ApiProperty({
    description: 'The type/category of the message template',
    enum: MessageTemplateType,
    example: MessageTemplateType.GREETING
  })
  type: MessageTemplateType;

  @ApiProperty({
    description: 'When the template was created',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the template was last updated',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}

export class MessageTemplateListResponseDto {
  @ApiProperty({
    description: 'Array of message templates',
    type: [MessageTemplateResponseDto]
  })
  templates: MessageTemplateResponseDto[];

  @ApiProperty({
    description: 'Total number of templates matching the filters',
    example: 25
  })
  total: number;

  @ApiProperty({
    description: 'Number of templates per page',
    example: 20
  })
  limit: number;

  @ApiProperty({
    description: 'Number of templates to skip for pagination',
    example: 0
  })
  offset: number;
}

export class MessageTemplateStatsResponseDto {
  @ApiProperty({
    description: 'Total number of templates',
    example: 50
  })
  total: number;

  @ApiProperty({
    description: 'Count of templates by type',
    example: {
      greeting: 15,
      follow_up: 10,
      reminder: 8,
      support: 7,
      marketing: 5,
      notification: 3,
      custom: 2
    }
  })
  byType: Record<string, number>;
}

export class CreateMessageTemplateResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Message template created successfully'
  })
  message: string;

  @ApiProperty({
    description: 'The created message template',
    type: MessageTemplateResponseDto
  })
  data: MessageTemplateResponseDto;
}

export class UpdateMessageTemplateResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Message template updated successfully'
  })
  message: string;

  @ApiProperty({
    description: 'The updated message template',
    type: MessageTemplateResponseDto
  })
  data: MessageTemplateResponseDto;
}
