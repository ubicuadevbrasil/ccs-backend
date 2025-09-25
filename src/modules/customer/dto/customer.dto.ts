import { 
  IsEmail, 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUUID, 
  IsBoolean, 
  IsNumber, 
  IsArray,
  MinLength, 
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatus, CustomerType, CustomerPlatform } from '../entities/customer.entity';

export class CreateCustomerTagDto {
  @ApiProperty({
    description: 'Tag value',
    example: 'vip',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  tag: string;
}

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Platform-specific ID (WhatsApp phone, Telegram user_id, etc.)',
    example: '5511999999999',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  platformId: string;

  @ApiPropertyOptional({
    description: 'Display name from platform',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pushName?: string;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/profile.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profilePicUrl?: string;

  @ApiPropertyOptional({
    description: 'Platform phone number',
    example: '+5511999999999',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contact?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'CPF (Brazilian individual tax ID)',
    example: '12345678901',
    maxLength: 14,
  })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  cpf?: string;

  @ApiPropertyOptional({
    description: 'CNPJ (Brazilian company tax ID)',
    example: '12345678000195',
    maxLength: 18,
  })
  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string;

  @ApiPropertyOptional({
    description: 'Priority level for customer service',
    example: 5,
    minimum: 0,
    maximum: 10,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Whether this is a group contact',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({
    description: 'Customer type',
    enum: CustomerType,
    example: CustomerType.CONTACT,
    default: CustomerType.CONTACT,
  })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @ApiPropertyOptional({
    description: 'Customer status',
    enum: CustomerStatus,
    example: CustomerStatus.ACTIVE,
    default: CustomerStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @ApiPropertyOptional({
    description: 'Platform type',
    enum: CustomerPlatform,
    example: CustomerPlatform.WHATSAPP,
    default: CustomerPlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(CustomerPlatform)
  platform?: CustomerPlatform;

  @ApiPropertyOptional({
    description: 'Internal notes/observations',
    example: 'VIP customer, prefers morning calls',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;

  @ApiPropertyOptional({
    description: 'Customer tags',
    type: [String],
    example: ['vip', 'premium'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(20)
  tags?: string[];
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({
    description: 'Platform-specific ID (WhatsApp phone, Telegram user_id, etc.)',
    example: '5511999999999',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  platformId?: string;

  @ApiPropertyOptional({
    description: 'Display name from platform',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pushName?: string;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/profile.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profilePicUrl?: string;

  @ApiPropertyOptional({
    description: 'Platform phone number',
    example: '+5511999999999',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contact?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'CPF (Brazilian individual tax ID)',
    example: '12345678901',
    maxLength: 14,
  })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  cpf?: string;

  @ApiPropertyOptional({
    description: 'CNPJ (Brazilian company tax ID)',
    example: '12345678000195',
    maxLength: 18,
  })
  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string;

  @ApiPropertyOptional({
    description: 'Priority level for customer service',
    example: 5,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Whether this is a group contact',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({
    description: 'Customer type',
    enum: CustomerType,
    example: CustomerType.CONTACT,
  })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @ApiPropertyOptional({
    description: 'Customer status',
    enum: CustomerStatus,
    example: CustomerStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @ApiPropertyOptional({
    description: 'Platform type',
    enum: CustomerPlatform,
    example: CustomerPlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(CustomerPlatform)
  platform?: CustomerPlatform;

  @ApiPropertyOptional({
    description: 'Internal notes/observations',
    example: 'VIP customer, prefers morning calls',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;

  @ApiPropertyOptional({
    description: 'Customer tags',
    type: [String],
    example: ['vip', 'premium'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(20)
  tags?: string[];
}

export class CustomerResponseDto {
  @ApiProperty({
    description: 'Customer unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Platform-specific ID',
    example: '5511999999999',
  })
  platformId: string;

  @ApiPropertyOptional({
    description: 'Display name from platform',
    example: 'John Doe',
  })
  pushName?: string;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'John Doe',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  profilePicUrl?: string;

  @ApiPropertyOptional({
    description: 'Platform phone number',
    example: '+5511999999999',
  })
  contact?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'CPF (Brazilian individual tax ID)',
    example: '12345678901',
  })
  cpf?: string;

  @ApiPropertyOptional({
    description: 'CNPJ (Brazilian company tax ID)',
    example: '12345678000195',
  })
  cnpj?: string;

  @ApiProperty({
    description: 'Priority level for customer service',
    example: 5,
  })
  priority: number;

  @ApiProperty({
    description: 'Whether this is a group contact',
    example: false,
  })
  isGroup: boolean;

  @ApiProperty({
    description: 'Customer type',
    enum: CustomerType,
    example: CustomerType.CONTACT,
  })
  type: CustomerType;

  @ApiProperty({
    description: 'Customer status',
    enum: CustomerStatus,
    example: CustomerStatus.ACTIVE,
  })
  status: CustomerStatus;

  @ApiProperty({
    description: 'Platform type',
    enum: CustomerPlatform,
    example: CustomerPlatform.WHATSAPP,
  })
  platform: CustomerPlatform;

  @ApiPropertyOptional({
    description: 'Internal notes/observations',
    example: 'VIP customer, prefers morning calls',
  })
  observations?: string;

  @ApiProperty({
    description: 'Customer creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Customer last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether customer is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether customer is blocked',
    example: false,
  })
  isBlocked: boolean;

  @ApiProperty({
    description: 'Whether customer has high priority',
    example: true,
  })
  isHighPriority: boolean;

  @ApiProperty({
    description: 'Whether this is a group contact',
    example: false,
  })
  isGroupContact: boolean;

  @ApiProperty({
    description: 'Whether customer has profile picture',
    example: true,
  })
  hasProfilePicture: boolean;

  @ApiProperty({
    description: 'Display name for the customer',
    example: 'John Doe',
  })
  displayName: string;

  @ApiProperty({
    description: 'Customer tags',
    type: 'array',
    items: { type: 'string' },
    example: ['vip', 'premium'],
  })
  tags: string[];
}

export class CustomerQueryDto {
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
    description: 'Search term for name, email, contact, or platformId',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer status',
    enum: CustomerStatus,
    example: CustomerStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @ApiPropertyOptional({
    description: 'Filter by customer type',
    enum: CustomerType,
    example: CustomerType.CONTACT,
  })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @ApiPropertyOptional({
    description: 'Filter by platform',
    enum: CustomerPlatform,
    example: CustomerPlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(CustomerPlatform)
  platform?: CustomerPlatform;

  @ApiPropertyOptional({
    description: 'Filter by priority level',
    example: 5,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Filter by group contacts only',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'vip,premium',
  })
  @IsOptional()
  @IsString()
  tags?: string;
}

export class FindCustomerDto {
  @ApiProperty({
    description: 'Customer unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class UpdateCustomerByIdDto {
  @ApiProperty({
    description: 'Customer unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    description: 'Platform-specific ID (WhatsApp phone, Telegram user_id, etc.)',
    example: '5511999999999',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  platformId?: string;

  @ApiPropertyOptional({
    description: 'Display name from platform',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pushName?: string;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://example.com/profile.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profilePicUrl?: string;

  @ApiPropertyOptional({
    description: 'Platform phone number',
    example: '+5511999999999',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contact?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'CPF (Brazilian individual tax ID)',
    example: '12345678901',
    maxLength: 14,
  })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  cpf?: string;

  @ApiPropertyOptional({
    description: 'CNPJ (Brazilian company tax ID)',
    example: '12345678000195',
    maxLength: 18,
  })
  @IsOptional()
  @IsString()
  @MaxLength(18)
  cnpj?: string;

  @ApiPropertyOptional({
    description: 'Priority level for customer service',
    example: 5,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Whether this is a group contact',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({
    description: 'Customer type',
    enum: CustomerType,
    example: CustomerType.CONTACT,
  })
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @ApiPropertyOptional({
    description: 'Customer status',
    enum: CustomerStatus,
    example: CustomerStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @ApiPropertyOptional({
    description: 'Platform type',
    enum: CustomerPlatform,
    example: CustomerPlatform.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(CustomerPlatform)
  platform?: CustomerPlatform;

  @ApiPropertyOptional({
    description: 'Internal notes/observations',
    example: 'VIP customer, prefers morning calls',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;

  @ApiPropertyOptional({
    description: 'Customer tags',
    type: [String],
    example: ['vip', 'premium'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(20)
  tags?: string[];
}

export class DeleteCustomerDto {
  @ApiProperty({
    description: 'Customer unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
