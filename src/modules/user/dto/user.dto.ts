import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfile, UserStatus } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'User login identifier',
    example: 'john.doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  login: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User contact information (phone, etc.)',
    example: '+1234567890',
    minLength: 10,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(20)
  contact: string;

  @ApiPropertyOptional({
    description: 'User profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({
    description: 'User profile/role',
    enum: UserProfile,
    example: UserProfile.OPERATOR,
  })
  @IsEnum(UserProfile)
  @IsNotEmpty()
  profile: UserProfile;

  @ApiPropertyOptional({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    default: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User login identifier',
    example: 'john.doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  login?: string;

  @ApiPropertyOptional({
    description: 'User password',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User contact information (phone, etc.)',
    example: '+1234567890',
    minLength: 10,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  contact?: string;

  @ApiPropertyOptional({
    description: 'User profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({
    description: 'User profile/role',
    enum: UserProfile,
    example: UserProfile.OPERATOR,
  })
  @IsOptional()
  @IsEnum(UserProfile)
  profile?: UserProfile;

  @ApiPropertyOptional({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User login identifier',
    example: 'john.doe',
  })
  login: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User contact information',
    example: '+1234567890',
  })
  contact: string;

  @ApiPropertyOptional({
    description: 'User profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  profilePicture?: string;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'User profile/role',
    enum: UserProfile,
    example: UserProfile.OPERATOR,
  })
  profile: UserProfile;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether user is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether user is admin',
    example: false,
  })
  isAdmin: boolean;

  @ApiProperty({
    description: 'Whether user is supervisor',
    example: false,
  })
  isSupervisor: boolean;

  @ApiProperty({
    description: 'Whether user is operator',
    example: true,
  })
  isOperator: boolean;
}

export class UserQueryDto {
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
    description: 'Search term for name, email, or login',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by user status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Filter by user profile',
    enum: UserProfile,
    example: UserProfile.OPERATOR,
  })
  @IsOptional()
  @IsEnum(UserProfile)
  profile?: UserProfile;
}

export class FindUserDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

export class UpdateUserByIdDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    description: 'User login identifier',
    example: 'john.doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  login?: string;

  @ApiPropertyOptional({
    description: 'User password',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User contact information (phone, etc.)',
    example: '+1234567890',
    minLength: 10,
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  contact?: string;

  @ApiPropertyOptional({
    description: 'User profile picture URL',
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({
    description: 'User profile/role',
    enum: UserProfile,
    example: UserProfile.OPERATOR,
  })
  @IsOptional()
  @IsEnum(UserProfile)
  profile?: UserProfile;

  @ApiPropertyOptional({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class DeleteUserDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
