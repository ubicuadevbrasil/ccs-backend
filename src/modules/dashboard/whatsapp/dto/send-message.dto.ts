import { IsString, IsNotEmpty, IsOptional, IsPhoneNumber, IsIn } from 'class-validator';

/**
 * DTO for sending WhatsApp messages
 */
export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  @IsIn(['text', 'image', 'document', 'audio', 'video'])
  type?: string = 'text';

  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
