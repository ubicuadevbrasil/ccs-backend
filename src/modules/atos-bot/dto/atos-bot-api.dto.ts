/**
 * DTOs for Atos Bot API endpoints
 * These endpoints are consumed by external systems (ATOS bot, web chat, etc.)
 */

import { IsString, IsOptional, IsArray, IsObject, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// WhatsApp Session DTOs
export class WhatsAppSessionDto {
  @ApiProperty({ description: 'Session ID' })
  @IsString()
  sessionId: string;
}

// Send Media DTOs
export class SendMediaDto {
  @ApiProperty({ description: 'File transaction payload' })
  @IsObject()
  filetx: {
    session: string;
    cnpj: string;
    name: string;
    type: string;
    hashfile: string;
    descfile: string;
    myMedia: string;
  };
}

export class SendMediaResponseDto {
  @ApiProperty()
  hashfile: string;

  @ApiProperty()
  descfile: string;

  @ApiProperty()
  type: string;
}

// Input Excel DTOs
export class InputExcelDto {
  @ApiProperty({ description: 'File transaction payload' })
  @IsObject()
  filetx: {
    session: string;
    cnpj: string;
    name: string;
    telefone: string;
    type: string;
    hashfile: string;
    descfile: string;
    origem: string;
  };
}

export class InputExcelResponseDto {
  @ApiProperty()
  hashfile: string;

  @ApiProperty()
  descfile: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  data?: any;
}

// Get Excel Info DTOs
export class GetExcelInfoQueryDto {
  @ApiProperty()
  @IsString()
  session: string;
}

// Bot Log DTOs
export class BotLogDto {
  @ApiProperty({ description: 'Bot log data' })
  @IsObject()
  data: {
    sessionId: string;
    destination: string;
    message: string;
    text?: string[];
    name?: string;
    cnpj?: string;
  };
}

// Message DTOs (v1)
export class MessageV1Dto {
  @ApiProperty()
  @IsObject()
  event: string;

  @ApiPropertyOptional()
  uid?: string;

  @ApiPropertyOptional()
  contact?: {
    uid: string;
    name: string;
    type: string;
  };

  @ApiPropertyOptional()
  message?: {
    type: string;
    ack: string;
    cuid: string;
    dir: string;
    dtm: number;
    uid: string;
    body?: {
      text?: string;
      caption?: string;
      mimetype?: string;
      size?: number;
      thumb?: string;
      url?: string;
      duration?: number;
      contact?: string;
      vcard?: string;
      name?: string;
      lng?: number;
      lat?: number;
    };
    content?: {
      text?: string;
    };
  };
}

// Message DTOs (v2)
export class MessageV2Dto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  event: string;

  @ApiPropertyOptional()
  uid?: string;

  @ApiPropertyOptional()
  contact_uid?: string;

  @ApiPropertyOptional()
  contact_name?: string;

  @ApiPropertyOptional()
  contact_type?: string;

  @ApiPropertyOptional()
  message_ack?: string;

  @ApiPropertyOptional()
  message_cuid?: string;

  @ApiPropertyOptional()
  message_dir?: string;

  @ApiPropertyOptional()
  message_dtm?: number;

  @ApiPropertyOptional()
  message_type?: string;

  @ApiPropertyOptional()
  message_uid?: string;

  @ApiPropertyOptional()
  body_text?: string;
}

// Check WhatsApp DTOs
export class CheckWhatsAppDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}

export class CheckWhatsAppResponseDto {
  @ApiProperty()
  whatsapp: boolean;
}

// Check Optin DTOs
export class CheckOptinDto {
  @ApiProperty()
  @IsString()
  cnpj: string;
}

export class CheckOptinResponseDto {
  @ApiProperty()
  optin: boolean;

  @ApiPropertyOptional()
  customers?: any[];
}

// Check Skip Bot DTOs
export class CheckSkipBotDto {
  @ApiProperty()
  @IsString()
  cnpj: string;
}

export class CheckSkipBotResponseDto {
  @ApiProperty()
  skipBot: boolean;

  @ApiPropertyOptional()
  customers?: any[];
}

// Cadastro Optin DTOs
export class CadastroOptinDto {
  @ApiProperty()
  @IsString()
  cnpj: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  email: string;
}

// Update Optin DTOs
export class UpdateOptinDto {
  @ApiProperty()
  @IsString()
  cnpj: string;
}

// Transbordo DTOs
export class TransbordoDto {
  @ApiProperty()
  @IsString()
  cnpj: string;

  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiPropertyOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  segmento?: string;
}

export class TransbordoResponseDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  resultado: string;
}

// Encerra Bot DTOs
export class EncerraBotDto {
  @ApiProperty()
  @IsString()
  session: string;

  @ApiPropertyOptional()
  @IsArray()
  old_sessions?: string[];

  @ApiProperty()
  @IsObject()
  pedido: {
    order_id: string;
    total_value: number;
  };

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  mobile: string;

  @ApiProperty()
  @IsString()
  cnpj: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  telefone: string;

  @ApiProperty()
  @IsString()
  destination: string;

  @ApiProperty()
  @IsString()
  dtin: string;

  @ApiProperty()
  @IsString()
  dtat: string;

  @ApiPropertyOptional()
  @IsString()
  avaliacao?: string;

  @ApiPropertyOptional()
  @IsString()
  segmento?: string;
}

// Confirma Pedido DTOs
export class ConfirmaPedidoDto {
  @ApiProperty()
  @IsString()
  session: string;

  @ApiProperty()
  @IsObject()
  pedido: {
    order_id: string;
    total_value: number;
  };

  @ApiProperty()
  @IsString()
  segmento: string;
}

// Bot Message DTOs
export class BotMessageDto {
  @ApiProperty()
  @IsString()
  cnpj: string;

  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiPropertyOptional()
  @IsString()
  message?: string;
}

export class BotMessageResponseDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  resultado: string;
}

// Bot Chat DTOs
export class BotChatDto {
  @ApiProperty()
  @IsString()
  cnpj: string;

  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiPropertyOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  segmento?: string;

  @ApiPropertyOptional()
  @IsString()
  telefone?: string;

  @ApiProperty()
  @IsObject()
  chat: any;

  @ApiProperty()
  @IsString()
  dataini: string;

  @ApiPropertyOptional()
  @IsString()
  transfer?: string;
}

// Bot Status DTOs
export class BotStatusDto {
  @ApiProperty({ description: 'JSON stringified data' })
  @IsString()
  data: string;
}

export class BotStatusResponseDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  resultado: string;
}

// Bot Email DTOs
export class BotEmailDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}

// User Connect/Disconnect Chatweb DTOs
export class UserConnectChatwebDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}

// Check Agents DTOs
export class CheckAgentsResponseDto {
  @ApiProperty()
  online: number;

  @ApiProperty()
  training: boolean;
}

// Ubicua Vendas DTOs
export class UbicuaVendasQueryDto {
  @ApiPropertyOptional()
  @IsString()
  date_start?: string;

  @ApiPropertyOptional()
  @IsString()
  date_end?: string;
}

// Mola Check DTOs
export class MolaCheckDto {
  @ApiProperty()
  @IsString()
  file: string;
}

export class MolaCheckResponseDto {
  @ApiProperty()
  read: boolean;
}

// Mola Update DTOs
export class MolaUpdateDto {
  @ApiProperty()
  @IsString()
  mailing: string;

  @ApiProperty()
  @IsArray()
  data: Array<{
    cnpj: string;
    email: string;
    telefone: string;
    nome: string;
  }>;
}

