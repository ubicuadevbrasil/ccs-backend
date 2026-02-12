import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const otimaWhatsAppMessageTypes = [
  'text',
  'image',
  'video',
  'audio',
  'document',
] as const;

export type OtimaWhatsAppMessageType = (typeof otimaWhatsAppMessageTypes)[number];

export class OtimaSendMessageDto {
  @ApiProperty({ description: 'Recipient phone number in international format' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'WhatsApp message type',
    enum: otimaWhatsAppMessageTypes,
  })
  @IsEnum(otimaWhatsAppMessageTypes)
  type: OtimaWhatsAppMessageType;

  @ApiPropertyOptional({ description: 'Text message body' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'Media URL for image/video/audio/document' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Caption for media content' })
  @IsOptional()
  @IsString()
  caption?: string;
}

export class OtimaSendTemplateMessageDto {
  @ApiProperty({ description: 'Recipient phone number in international format' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Template identifier/name in Otima' })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiPropertyOptional({
    description: 'Template parameters to interpolate in the message',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  parameters?: string[];
}

export class OtimaCheckWhatsappDto {
  @ApiProperty({ description: 'Phone number to check WhatsApp availability for' })
  @IsString()
  @IsNotEmpty()
  mobileExist: string;
}

export class OtimaFileDto {
  @ApiPropertyOptional({ description: 'File caption' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({
    description: 'File URL, must be public address',
    example: 'http://mydomain.com/myfile.pdf',
  })
  @IsString()
  @IsNotEmpty()
  file: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  @IsString()
  @IsNotEmpty()
  mime_type: string;
}

export class OtimaHsmFileDto {
  @ApiProperty({
    description: 'File name',
    example: 'file.jpg',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'File URL',
    example: 'https://mydomain.com/file.jpg',
  })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class OtimaFileBase64Dto {
  @ApiProperty({
    description: 'File data in base64 format',
  })
  @IsString()
  @IsNotEmpty()
  base64_data: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  @IsString()
  @IsNotEmpty()
  mime_type: string;

  @ApiProperty({
    description: 'File name',
    example: 'file.pdf',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class OtimaBulkTextMessageItemDto {
  @ApiPropertyOptional({
    description: 'Message date in format YYYY-MM-DD HH:mm:ss',
    example: '2025-12-23 14:38:24',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Document identifier for tracking (can be anything: cpf, social secure number)',
    example: 'ABC12345',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    description: 'Extra fields for several usages (cpf_cnpj, contrato)',
    example: { cpf_cnpj: '12345678901' },
  })
  @IsOptional()
  @IsObject()
  extra_fields?: Record<string, any>;

  @ApiProperty({ description: 'Text content of the message' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Recipient WhatsApp number in international format',
    example: '5541999999999',
  })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;
}

export class OtimaBulkTextMessagesDto {
  @ApiPropertyOptional({ description: 'Broker code configured in Otima' })
  @IsOptional()
  @IsString()
  brokerCode?: string;

  @ApiPropertyOptional({ description: 'Customer code configured in Otima' })
  @IsOptional()
  @IsString()
  customerCode?: string;

  @ApiProperty({
    description: 'Array of text messages to send in bulk (max 1000 per request)',
    type: [OtimaBulkTextMessageItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtimaBulkTextMessageItemDto)
  messages: OtimaBulkTextMessageItemDto[];
}

export class OtimaBulkFileMessageItemDto {
  @ApiPropertyOptional({
    description: 'Message date in format YYYY-MM-DD HH:mm:ss',
    example: '2025-12-23 14:38:24',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Document identifier for tracking (can be anything: cpf, social secure number)',
    example: 'ABC12345',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    description: 'Extra fields for several usages (cpf_cnpj, contrato)',
    example: { cpf_cnpj: '12345678901' },
  })
  @IsOptional()
  @IsObject()
  extra_fields?: Record<string, any>;

  @ApiProperty({
    description: 'File information to be sent',
    type: OtimaFileDto,
  })
  @ValidateNested()
  @Type(() => OtimaFileDto)
  file: OtimaFileDto;

  @ApiProperty({
    description: 'Recipient WhatsApp number in international format',
    example: '5541999999999',
  })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;
}

export class OtimaBulkFileMessagesDto {
  @ApiPropertyOptional({ description: 'Broker code configured in Otima' })
  @IsOptional()
  @IsString()
  brokerCode?: string;

  @ApiPropertyOptional({ description: 'Customer code configured in Otima' })
  @IsOptional()
  @IsString()
  customerCode?: string;

  @ApiProperty({
    description: 'Array of file/document messages to send in bulk (max 1000 per request)',
    type: [OtimaBulkFileMessageItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtimaBulkFileMessageItemDto)
  messages: OtimaBulkFileMessageItemDto[];
}

export class OtimaBulkHsmMessageItemDto {
  @ApiPropertyOptional({
    description: 'Message date in format YYYY-MM-DD HH:mm:ss',
    example: '2025-12-23 14:38:24',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Document identifier for tracking (can be anything: cpf, social secure number)',
    example: 'ABC12345',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    description: 'Extra fields for several usages (gocheck, receptivo)',
    example: { cpf_cnpj: '12345678901' },
  })
  @IsOptional()
  @IsObject()
  extra_fields?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Optional HSM file (image or document) associated with the message',
    type: OtimaHsmFileDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OtimaHsmFileDto)
  hsm_file?: OtimaHsmFileDto;

  @ApiPropertyOptional({
    description: 'Callback URL for MO (inbound) events',
  })
  @IsOptional()
  @IsString()
  url_callback_mo?: string;

  @ApiPropertyOptional({
    description: 'Callback URL for status events',
  })
  @IsOptional()
  @IsString()
  url_callback_status?: string;

  @ApiPropertyOptional({
    description: 'Template variables map, e.g. { "-var1-": "name", "-var2-": "document" }',
    example: { '-var1-': 'name', '-var2-': 'document' },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiProperty({
    description: 'Recipient WhatsApp number in international format',
    example: '5541999999999',
  })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;
}

export class OtimaBulkHsmMessagesDto {
  @ApiPropertyOptional({ description: 'Broker code configured in Otima' })
  @IsOptional()
  @IsString()
  brokerCode?: string;

  @ApiPropertyOptional({ description: 'Customer code configured in Otima' })
  @IsOptional()
  @IsString()
  customerCode?: string;

  @ApiProperty({ description: 'Template code configured in Otima' })
  @IsString()
  @IsNotEmpty()
  templateCode: string;

  @ApiProperty({
    description: 'Array of HSM messages to send in bulk (max 1000 per request)',
    type: [OtimaBulkHsmMessageItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtimaBulkHsmMessageItemDto)
  messages: OtimaBulkHsmMessageItemDto[];
}

export class OtimaSingleHsmBase64FileDto {
  @ApiPropertyOptional({ description: 'Broker code configured in Otima' })
  @IsOptional()
  @IsString()
  brokerCode?: string;

  @ApiPropertyOptional({ description: 'Customer code configured in Otima' })
  @IsOptional()
  @IsString()
  customerCode?: string;

  @ApiPropertyOptional({
    description: 'Message date in format YYYY-MM-DD HH:mm:ss',
    example: '2025-12-23 14:38:24',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    description: 'Document identifier for tracking (can be anything: cpf, social secure number)',
    example: 'ABC12345',
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiPropertyOptional({
    description: 'Extra fields for several usages (gocheck, receptivo)',
    example: { cpf_cnpj: '12345678901' },
  })
  @IsOptional()
  @IsObject()
  extra_fields?: Record<string, any>;

  @ApiProperty({
    description: 'File data in base64 format',
    type: OtimaFileBase64Dto,
  })
  @ValidateNested()
  @Type(() => OtimaFileBase64Dto)
  file: OtimaFileBase64Dto;

  @ApiPropertyOptional({
    description: 'Text content (optional)',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({ description: 'Template code configured in Otima' })
  @IsString()
  @IsNotEmpty()
  templateCode: string;

  @ApiPropertyOptional({
    description: 'Template variables map, e.g. { "-var1-": "name", "-var2-": "document" }',
    example: { '-var1-': 'name', '-var2-': 'document' },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiProperty({
    description: 'Recipient WhatsApp number in international format',
    example: '5541999999999',
  })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;
}

export class OtimaMailmanHsmDto {
  @ApiPropertyOptional({ description: 'Broker code configured in Otima' })
  @IsOptional()
  @IsString()
  brokerCode?: string;

  @ApiPropertyOptional({ description: 'Customer code configured in Otima' })
  @IsOptional()
  @IsString()
  customerCode?: string;

  @ApiPropertyOptional({
    description: 'Message date in format YYYY-MM-DD HH:mm:ss',
    example: '2025-12-23 14:38:24',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    description: 'Document identifier for tracking (can be anything: cpf, social secure number)',
    example: 'ABC12345',
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiPropertyOptional({
    description: 'Fallback text used when message fails',
  })
  @IsOptional()
  @IsString()
  failed_message?: string;

  @ApiProperty({
    description: 'File data in base64 format',
    type: OtimaFileBase64Dto,
  })
  @ValidateNested()
  @Type(() => OtimaFileBase64Dto)
  file: OtimaFileBase64Dto;

  @ApiProperty({
    description: 'Line digit (linha digitável) of the document',
  })
  @IsString()
  @IsNotEmpty()
  linha_digitavel: string;

  @ApiProperty({ description: 'Template code configured in Otima' })
  @IsString()
  @IsNotEmpty()
  templateCode: string;

  @ApiPropertyOptional({
    description: 'Template variables map, e.g. { "-var1-": "name", "-var2-": "document" }',
    example: { '-var1-': 'name', '-var2-': 'document' },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiProperty({
    description: 'Recipient WhatsApp number in international format',
    example: '5541999999999',
  })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;
}


