import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, ApiExtraModels } from '@nestjs/swagger';

/**
 * DTOs for Vonage WhatsApp Business API
 */

export class VonageSendMessageDto {
  @ApiProperty({ description: 'Recipient phone number' })
  @IsString()
  @IsNotEmpty()
  toNumber: string;

  @ApiProperty({ 
    description: 'Message type',
    enum: ['text', 'image', 'video', 'audio', 'file', 'template_mtm', 'template_custom', 'template_optin', 'template_chatweb_prd', 'template_chatweb_hml']
  })
  @IsEnum(['text', 'image', 'video', 'audio', 'file', 'template_mtm', 'template_custom', 'template_optin', 'template_chatweb_prd', 'template_chatweb_hml'])
  type: string;

  @ApiPropertyOptional({ description: 'Text message content' })
  @IsOptional()
  @IsString()
  txtMessage?: string;

  @ApiPropertyOptional({ description: 'Media URL for image/video/audio/file' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Media caption' })
  @IsOptional()
  @IsString()
  mediaCaption?: string;

  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  template_name?: string;

  @ApiPropertyOptional({ description: 'Template namespace' })
  @IsOptional()
  @IsString()
  template_namespace?: string;

  @ApiPropertyOptional({ description: 'Template parameters', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  parameters?: string[];

  @ApiPropertyOptional({ description: 'Template components' })
  @IsOptional()
  components?: any[];

  @ApiPropertyOptional({ description: 'Context for replies - message UUID to reply to' })
  @IsOptional()
  @IsString()
  contextMessageUuid?: string;
}

export class InboundMessageWebhookDto {
  @ApiProperty({ description: 'Message UUID' })
  @IsString()
  @IsNotEmpty()
  message_uuid: string;

  @ApiProperty({ description: 'Recipient number' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Sender number' })
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({ description: 'Message timestamp' })
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @ApiProperty({ description: 'Message direction' })
  @IsString()
  @IsNotEmpty()
  direction: string;

  @ApiProperty({ description: 'Message content' })
  @ValidateNested()
  @Type(() => Object)
  message: {
    content: {
      type: string;
      text?: string;
      image?: {
        url: string;
        caption?: string;
      };
      video?: {
        url: string;
        caption?: string;
      };
      audio?: {
        url: string;
      };
      file?: {
        url: string;
        caption?: string;
      };
      button?: {
        text: string;
      };
    };
  };
}

export class StatusWebhookDto {
  @ApiProperty({ description: 'Message UUID' })
  @IsString()
  @IsNotEmpty()
  message_uuid: string;

  @ApiProperty({ description: 'Recipient number' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Sender number' })
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({ description: 'Message timestamp' })
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @ApiProperty({ 
    description: 'Message status',
    enum: ['delivered', 'read', 'sent', 'failed']
  })
  @IsEnum(['delivered', 'read', 'sent', 'failed'])
  status: string;

  @ApiPropertyOptional({ description: 'Error details' })
  @IsOptional()
  error?: {
    code: number;
    reason: string;
  };
}

/**
 * DTOs for Vonage WhatsApp Business API Sandbox Environment
 * These DTOs handle the different webhook structure used in sandbox/development mode
 */

export class SandboxInboundMessageWebhookDto {
  @ApiProperty({ description: 'Message UUID' })
  @IsString()
  @IsNotEmpty()
  message_uuid: string;

  @ApiProperty({ description: 'Recipient number' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Sender number' })
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({ description: 'Message timestamp' })
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @ApiProperty({ 
    description: 'Message type',
    enum: ['text', 'button', 'image', 'sticker', 'video', 'audio', 'ptt', 'document', 'vcard', 'location', 'file', 'reaction']
  })
  @IsEnum(['text', 'button', 'image', 'sticker', 'video', 'audio', 'ptt', 'document', 'vcard', 'location', 'file', 'reaction'])
  message_type: string;

  @ApiPropertyOptional({ description: 'Text message content' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'Image data' })
  @IsOptional()
  image?: {
    url: string;
    caption?: string;
  };

  @ApiPropertyOptional({ description: 'Sticker data' })
  @IsOptional()
  sticker?: {
    url: string;
  };

  @ApiPropertyOptional({ description: 'Video data' })
  @IsOptional()
  video?: {
    url: string;
    caption?: string;
  };

  @ApiPropertyOptional({ description: 'Audio data' })
  @IsOptional()
  audio?: {
    url: string;
  };

  @ApiPropertyOptional({ description: 'Document data' })
  @IsOptional()
  document?: {
    url: string;
    caption?: string;
  };

  @ApiPropertyOptional({ description: 'File data' })
  @IsOptional()
  file?: {
    url: string;
    caption?: string;
  };

  @ApiPropertyOptional({ description: 'Message body for ptt, document, vcard, location' })
  @IsOptional()
  message?: {
    body?: {
      caption?: string;
      mimetype?: string;
      size?: string;
      duration?: string;
      url?: string;
      thumb?: string;
      contact?: string;
      vcard?: string;
      name?: string;
      lng?: string;
      lat?: string;
    };
  };

  @ApiPropertyOptional({ description: 'Reaction data' })
  @IsOptional()
  reaction?: {
    action: string;
    emoji: string;
  };

  @ApiPropertyOptional({ description: 'Context information for reactions' })
  @IsOptional()
  context?: {
    message_uuid: string;
  };
}

export class SandboxStatusWebhookDto {
  @ApiProperty({ description: 'Message UUID' })
  @IsString()
  @IsNotEmpty()
  message_uuid: string;

  @ApiProperty({ description: 'Recipient number' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Sender number' })
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({ description: 'Message timestamp' })
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @ApiProperty({ 
    description: 'Message status',
    enum: ['delivered', 'read', 'sent', 'failed']
  })
  @IsEnum(['delivered', 'read', 'sent', 'failed'])
  status: string;

  @ApiPropertyOptional({ description: 'Error details' })
  @IsOptional()
  error?: {
    code: number;
    reason: string;
  };
}
