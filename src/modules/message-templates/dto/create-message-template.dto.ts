import { IsString, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageTemplateType } from '../interfaces/message-template.interface';

export class CreateMessageTemplateDto {
  @ApiProperty({
    description: 'The message content of the template',
    example: 'Olá, bem vindo ao nosso serviço de atendimento ao cliente. Como posso ajudar você hoje?',
    maxLength: 1000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  message: string;

  @ApiProperty({
    description: 'The type/category of the message template',
    enum: MessageTemplateType,
    example: MessageTemplateType.GREETING
  })
  @IsEnum(MessageTemplateType)
  @IsNotEmpty()
  type: MessageTemplateType;
}
