import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsArray,
  IsObject,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TemplateStatus, TemplateCategory, TemplateButton } from '../entities/template.entity';

export class TemplateButtonDto {
  @ApiProperty({
    description: 'Button text',
    example: 'Sim, desejo dar continuidade ao atendimento.',
  })
  @IsString()
  @IsNotEmpty()
  texto_botao: string;

  @ApiProperty({
    description: 'Button type',
    example: 'RESPOSTA',
  })
  @IsString()
  @IsNotEmpty()
  tipo_botao: string;
}

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Template code (unique identifier)',
    example: 'TESTE',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  template_code: string;

  @ApiProperty({
    description: 'List of account identifiers',
    type: [String],
    example: ['558001904880'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  accounts: string[];

  @ApiPropertyOptional({
    description: 'Button samples',
    type: [TemplateButtonDto],
    example: [
      {
        texto_botao: 'Sim, desejo dar continuidade ao atendimento.',
        tipo_botao: 'RESPOSTA',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  @ArrayMaxSize(10)
  button_sample?: TemplateButtonDto[];

  @ApiProperty({
    description: 'Template category',
    enum: TemplateCategory,
    example: TemplateCategory.MARKETING,
  })
  @IsEnum(TemplateCategory)
  @IsNotEmpty()
  category: TemplateCategory;

  @ApiProperty({
    description: 'Template content/message',
    example: 'Olá -var1-, tudo bem? Contato de testes da Ubicua Brasil.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Template status',
    enum: TemplateStatus,
    example: TemplateStatus.ACTIVE,
  })
  @IsEnum(TemplateStatus)
  @IsNotEmpty()
  status: TemplateStatus;

  @ApiProperty({
    description: 'Status description',
    example: 'Ativo',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  status_description: string;

  @ApiPropertyOptional({
    description: 'Variable samples (key-value pairs)',
    example: { '-var1-': 'FABIO' },
  })
  @IsOptional()
  @IsObject()
  variable_sample?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Created date from Otima',
    example: '2024-03-13 11:45:57',
  })
  @IsOptional()
  @IsDateString()
  created_date?: string;

  @ApiPropertyOptional({
    description: 'Updated date from Otima',
    example: '2024-03-13 11:53:35',
  })
  @IsOptional()
  @IsDateString()
  updated_date?: string;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: 'List of account identifiers',
    type: [String],
    example: ['558001904880'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  accounts?: string[];

  @ApiPropertyOptional({
    description: 'Button samples',
    type: [TemplateButtonDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  @ArrayMaxSize(10)
  button_sample?: TemplateButtonDto[];

  @ApiPropertyOptional({
    description: 'Template category',
    enum: TemplateCategory,
  })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({
    description: 'Template content/message',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Template status',
    enum: TemplateStatus,
  })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional({
    description: 'Status description',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status_description?: string;

  @ApiPropertyOptional({
    description: 'Variable samples (key-value pairs)',
  })
  @IsOptional()
  @IsObject()
  variable_sample?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Created date from Otima',
  })
  @IsOptional()
  @IsDateString()
  created_date?: string;

  @ApiPropertyOptional({
    description: 'Updated date from Otima',
  })
  @IsOptional()
  @IsDateString()
  updated_date?: string;
}

export class TemplateResponseDto {
  @ApiProperty({
    description: 'Template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Template code',
    example: 'TESTE',
  })
  template_code: string;

  @ApiProperty({
    description: 'List of account identifiers',
    type: [String],
    example: ['558001904880'],
  })
  accounts: string[];

  @ApiProperty({
    description: 'Button samples',
    type: [TemplateButtonDto],
  })
  button_sample: TemplateButtonDto[];

  @ApiProperty({
    description: 'Template category',
    enum: TemplateCategory,
  })
  category: string;

  @ApiProperty({
    description: 'Template content',
  })
  content: string;

  @ApiProperty({
    description: 'Template status',
    enum: TemplateStatus,
  })
  status: TemplateStatus;

  @ApiProperty({
    description: 'Status description',
  })
  status_description: string;

  @ApiProperty({
    description: 'Variable samples (key-value pairs)',
    example: { '-var1-': 'FABIO', '-var2-': 'retorno da sua doação' },
  })
  variable_sample: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Created date from Otima',
  })
  created_date: Date | null;

  @ApiPropertyOptional({
    description: 'Updated date from Otima',
  })
  updated_date: Date | null;

  @ApiProperty({
    description: 'Template creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Template last update timestamp',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether template is active',
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether template has buttons',
  })
  hasButtons: boolean;

  @ApiProperty({
    description: 'Whether template has variables',
  })
  hasVariables: boolean;

  @ApiProperty({
    description: 'Number of variables',
  })
  variableCount: number;

  @ApiProperty({
    description: 'Number of buttons',
  })
  buttonCount: number;
}

export class TemplateQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Search term for template_code or content',
    example: 'TESTE',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by template status',
    enum: TemplateStatus,
  })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional({
    description: 'Filter by template category',
    enum: TemplateCategory,
  })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({
    description: 'Filter by template code',
    example: 'TESTE',
  })
  @IsOptional()
  @IsString()
  template_code?: string;
}

export class FindTemplateDto {
  @ApiProperty({
    description: 'Template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class UpdateTemplateByIdDto {
  @ApiProperty({
    description: 'Template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    description: 'List of account identifiers',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  accounts?: string[];

  @ApiPropertyOptional({
    description: 'Button samples',
    type: [TemplateButtonDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  @ArrayMaxSize(10)
  button_sample?: TemplateButtonDto[];

  @ApiPropertyOptional({
    description: 'Template category',
    enum: TemplateCategory,
  })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({
    description: 'Template content/message',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Template status',
    enum: TemplateStatus,
  })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional({
    description: 'Status description',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status_description?: string;

  @ApiPropertyOptional({
    description: 'Variable samples (key-value pairs)',
  })
  @IsOptional()
  @IsObject()
  variable_sample?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Created date from Otima',
  })
  @IsOptional()
  @IsDateString()
  created_date?: string;

  @ApiPropertyOptional({
    description: 'Updated date from Otima',
  })
  @IsOptional()
  @IsDateString()
  updated_date?: string;
}

export class DeleteTemplateDto {
  @ApiProperty({
    description: 'Template unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class SyncTemplatesDto {
  @ApiPropertyOptional({
    description: 'Otima customer code (optional)',
    example: 'CUSTOMER123',
  })
  @IsOptional()
  @IsString()
  customerCode?: string;
}

