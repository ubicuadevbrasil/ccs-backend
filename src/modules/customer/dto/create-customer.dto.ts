import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, IsUUID, Min, Max } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  remoteJid: string;

  @IsOptional()
  @IsString()
  pushName?: string;

  @IsOptional()
  @IsString()
  profilePicUrl?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @IsOptional()
  @IsBoolean()
  isSaved?: boolean;

  @IsOptional()
  @IsEnum(['contact'])
  type?: 'contact';

  @IsOptional()
  @IsEnum(['active', 'inactive', 'blocked'])
  status?: 'active' | 'inactive' | 'blocked';
} 