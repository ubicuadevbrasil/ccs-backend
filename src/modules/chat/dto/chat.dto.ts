import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, IsEnum, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Base DTOs for chat operations
export class SendTextDto {
  @ApiProperty({ description: 'WhatsApp instance name', example: 'instance1' })
  @IsString()
  instance: string;

  @ApiProperty({ description: 'Phone number to send message to', example: '5511999999999' })
  @IsString()
  number: string;

  @ApiProperty({ description: 'Text message content', example: 'Hello, how are you?' })
  @IsString()
  text: string;

  @IsOptional()
  @IsNumber()
  delay?: number;

  @IsOptional()
  @IsObject()
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };

  @IsOptional()
  @IsBoolean()
  linkPreview?: boolean;

  @IsOptional()
  @IsBoolean()
  mentionsEveryOne?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentioned?: string[];
}

export class SendMediaDto {
  @ApiProperty({ description: 'WhatsApp instance name', example: 'instance1' })
  @IsString()
  instance: string;

  @ApiProperty({ description: 'Phone number to send message to', example: '5511999999999' })
  @IsString()
  number: string;

  @ApiProperty({ description: 'Type of media', enum: ['image', 'video', 'document'], example: 'image' })
  @IsEnum(['image', 'video', 'document'])
  mediatype: 'image' | 'video' | 'document';

  @ApiProperty({ description: 'MIME type of the media', example: 'image/jpeg' })
  @IsString()
  mimetype: string;

  @ApiProperty({ description: 'Name of the media file', example: 'photo.jpg' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'Media content (URL or base64)', example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...' })
  @IsString()
  media: string; // url or base64

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsNumber()
  delay?: number;

  @IsOptional()
  @IsObject()
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };

  @IsOptional()
  @IsBoolean()
  mentionsEveryOne?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentioned?: string[];
}

export class SendAudioDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;

  @IsString()
  audio: string; // url or base64

  @IsOptional()
  @IsNumber()
  delay?: number;

  @IsOptional()
  @IsObject()
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };

  @IsOptional()
  @IsBoolean()
  mentionsEveryOne?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentioned?: string[];

  @IsOptional()
  @IsBoolean()
  encoding?: boolean;
}

export class SendLocationDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  delay?: number;

  @IsOptional()
  @IsObject()
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };

  @IsOptional()
  @IsBoolean()
  mentionsEveryOne?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentioned?: string[];
}

export class SendContactDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;

  @ValidateNested({ each: true })
  @Type(() => ContactInfoDto)
  contact: ContactInfoDto[];
}

export class ContactInfoDto {
  @IsString()
  fullName: string;

  @IsString()
  wuid: string;

  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  url?: string;
}

export class SendReactionDto {
  @IsString()
  instance: string;

  @IsObject()
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };

  @IsString()
  reaction: string;
}

export class SendStickerDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;

  @IsString()
  sticker: string; // url or base64

  @IsOptional()
  @IsNumber()
  delay?: number;

  @IsOptional()
  @IsObject()
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };

  @IsOptional()
  @IsBoolean()
  mentionsEveryOne?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentioned?: string[];
}

export class SendStatusDto {
  @IsString()
  instance: string;

  @IsEnum(['text', 'image', 'video', 'audio'])
  type: 'text' | 'image' | 'video' | 'audio';

  @IsString()
  content: string; // text or url

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsNumber()
  font?: 1 | 2 | 3 | 4 | 5;

  @IsOptional()
  @IsBoolean()
  allContacts?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  statusJidList?: string[];
}

// Chat Management DTOs
export class CheckWhatsAppNumbersDto {
  @ApiProperty({ description: 'WhatsApp instance name', example: 'instance1' })
  @IsString()
  instance: string;

  @ApiProperty({ description: 'Array of phone numbers to check', example: ['5511999999999', '5511888888888'] })
  @IsArray()
  @IsString({ each: true })
  numbers: string[];
}

export class MarkMessagesAsReadDto {
  @IsString()
  instance: string;

  @ValidateNested({ each: true })
  @Type(() => ReadMessageDto)
  readMessages: ReadMessageDto[];
}

export class ReadMessageDto {
  @IsString()
  remoteJid: string;

  @IsBoolean()
  fromMe: boolean;

  @IsString()
  id: string;
}

export class ArchiveChatDto {
  @IsString()
  instance: string;

  @IsObject()
  lastMessage: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
  };

  @IsString()
  chat: string;

  @IsBoolean()
  archive: boolean;
}

export class MarkChatUnreadDto {
  @IsString()
  instance: string;

  @IsObject()
  lastMessage: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
  };

  @IsString()
  chat: string;
}

export class DeleteMessageDto {
  @IsString()
  instance: string;

  @IsString()
  id: string;

  @IsString()
  remoteJid: string;

  @IsBoolean()
  fromMe: boolean;

  @IsOptional()
  @IsString()
  participant?: string;
}

export class FetchProfilePictureDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;
}

export class GetBase64FromMediaMessageDto {
  @IsString()
  instance: string;

  @IsObject()
  message: {
    key: {
      id: string;
    };
  };

  @IsOptional()
  @IsBoolean()
  convertToMp4?: boolean;
}

export class UpdateMessageDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;

  @IsObject()
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };

  @IsString()
  text: string;
}

export class SendPresenceDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;

  @IsOptional()
  @IsNumber()
  delay?: number;

  @IsEnum(['composing', 'recording', 'paused'])
  presence: 'composing' | 'recording' | 'paused';
}

export class UpdateBlockStatusDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;

  @IsEnum(['block', 'unblock'])
  status: 'block' | 'unblock';
}

export class FindContactsDto {
  @IsString()
  instance: string;

  @IsOptional()
  @IsObject()
  where?: {
    remoteJid?: string;
  };
}

export class FindMessagesDto {
  @IsString()
  instance: string;

  @IsOptional()
  @IsObject()
  where?: {
    key?: {
      remoteJid?: string;
    };
  };

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class FindStatusMessageDto {
  @IsString()
  instance: string;

  @IsOptional()
  @IsObject()
  where?: {
    remoteJid?: string;
    id?: string;
  };

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class FindChatsDto {
  @IsString()
  instance: string;
}

// Profile Management DTOs
export class FetchBusinessProfileDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;
}

export class FetchProfileDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;
}

export class UpdateProfileNameDto {
  @IsString()
  instance: string;

  @IsString()
  name: string;
}

export class UpdateProfileStatusDto {
  @IsString()
  instance: string;

  @IsString()
  status: string;
}

export class UpdateProfilePictureDto {
  @IsString()
  instance: string;

  @IsString()
  picture: string;
}

export class UpdatePrivacySettingsDto {
  @IsString()
  instance: string;

  @IsOptional()
  @IsEnum(['all', 'none'])
  readreceipts?: 'all' | 'none';

  @IsOptional()
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  profile?: 'all' | 'contacts' | 'contact_blacklist' | 'none';

  @IsOptional()
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  status?: 'all' | 'contacts' | 'contact_blacklist' | 'none';

  @IsOptional()
  @IsEnum(['all', 'match_last_seen'])
  online?: 'all' | 'match_last_seen';

  @IsOptional()
  @IsEnum(['all', 'contacts', 'contact_blacklist', 'none'])
  last?: 'all' | 'contacts' | 'contact_blacklist' | 'none';

  @IsOptional()
  @IsEnum(['all', 'contacts', 'contact_blacklist'])
  groupadd?: 'all' | 'contacts' | 'contact_blacklist';
}

// Label Management DTOs
export class FindLabelsDto {
  @IsString()
  instance: string;
}

export class HandleLabelDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;

  @IsString()
  labelId: string;

  @IsEnum(['add', 'remove'])
  action: 'add' | 'remove';
}

// Call Management DTOs
export class FakeCallDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;

  @IsBoolean()
  isVideo: boolean;

  @IsNumber()
  callDuration: number;
}

// Template DTOs
export class SendTemplateDto {
  @IsString()
  instance: string;

  @IsString()
  number: string;

  @IsString()
  name: string;

  @IsString()
  language: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsArray()
  @IsObject({ each: true })
  components: {
    type: string;
    parameters?: {
      type: string;
      text: string;
    }[];
    sub_type?: string;
    index?: string;
  }[];
}

// Media DTOs
export class GetMediaDto {
  @IsString()
  instance: string;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  messageId?: string;
}

export class GetMediaUrlDto {
  @IsString()
  instance: string;

  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  messageId?: string;
} 