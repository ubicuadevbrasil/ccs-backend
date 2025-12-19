import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
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

export class OtimaBulkTextMessageItemDto {
  @ApiProperty({ description: 'Message date in format YYYY-MM-DD HH:mm:ss' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Document identifier for tracking' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({ description: 'Text content of the message' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: 'Recipient WhatsApp number in international format' })
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
    description: 'Array of text messages to send in bulk',
    type: [OtimaBulkTextMessageItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtimaBulkTextMessageItemDto)
  messages: OtimaBulkTextMessageItemDto[];
}

export class OtimaBulkFileMessageItemDto {
  @ApiProperty({ description: 'Message date in format YYYY-MM-DD HH:mm:ss' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Document identifier for tracking' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({
    description: 'File information to be sent',
    example: {
      caption: 'myfile',
      file: 'http://mydomain.com/myfile.pdf',
      mime_type: 'application/pdf',
    },
  })
  file: {
    caption?: string;
    file: string;
    mime_type: string;
  };

  @ApiProperty({ description: 'Recipient WhatsApp number in international format' })
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
    description: 'Array of file/document messages to send in bulk',
    type: [OtimaBulkFileMessageItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtimaBulkFileMessageItemDto)
  messages: OtimaBulkFileMessageItemDto[];
}

export class OtimaBulkHsmMessageItemDto {
  @ApiProperty({ description: 'Message date in format YYYY-MM-DD HH:mm:ss' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Document identifier for tracking' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({
    description: 'Optional HSM file (image or document) associated with the message',
    example: {
      name: 'file.jpg',
      url: 'https://mydomain.com/file.jpg',
    },
  })
  @IsOptional()
  hsm_file?: {
    name: string;
    url: string;
  };

  @ApiPropertyOptional({ description: 'Callback URL for MO (inbound) events' })
  @IsOptional()
  @IsString()
  url_callback_mo?: string;

  @ApiPropertyOptional({ description: 'Callback URL for status events' })
  @IsOptional()
  @IsString()
  url_callback_status?: string;

  @ApiPropertyOptional({
    description: 'Template variables map, e.g. { "-var1-": "name" }',
  })
  @IsOptional()
  variables?: Record<string, string>;

  @ApiProperty({ description: 'Recipient WhatsApp number in international format' })
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
    description: 'Array of HSM messages to send in bulk',
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

  @ApiProperty({ description: 'Message date in format YYYY-MM-DD HH:mm:ss' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Document identifier for tracking' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({
    description: 'File data in base64 format',
    example: {
      base64_data: 'JVBERi0xLjUK...',
      mime_type: 'application/pdf',
      name: 'file.pdf',
    },
  })
  file: {
    base64_data: string;
    mime_type: string;
    name: string;
  };

  @ApiProperty({ description: 'Template code configured in Otima' })
  @IsString()
  @IsNotEmpty()
  templateCode: string;

  @ApiPropertyOptional({
    description: 'Template variables map, e.g. { "-var1-": "name" }',
  })
  @IsOptional()
  variables?: Record<string, string>;

  @ApiProperty({ description: 'Recipient WhatsApp number in international format' })
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

  @ApiProperty({ description: 'Message date in format YYYY-MM-DD HH:mm:ss' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Document identifier for tracking' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ description: 'Fallback text used when message fails' })
  @IsOptional()
  @IsString()
  failed_message?: string;

  @ApiProperty({
    description: 'File data in base64 format',
    example: {
      base64_data: 'JVBERi0xLjUK...',
      mime_type: 'application/pdf',
      name: 'file.pdf',
    },
  })
  file: {
    base64_data: string;
    mime_type: string;
    name: string;
  };

  @ApiProperty({ description: 'Line digit (linha digitável) of the document' })
  @IsString()
  @IsNotEmpty()
  linha_digitavel: string;

  @ApiProperty({ description: 'Template code configured in Otima' })
  @IsString()
  @IsNotEmpty()
  templateCode: string;

  @ApiPropertyOptional({
    description: 'Template variables map, e.g. { "-var1-": "name" }',
  })
  @IsOptional()
  variables?: Record<string, string>;

  @ApiProperty({ description: 'Recipient WhatsApp number in international format' })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;
}


