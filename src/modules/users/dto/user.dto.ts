import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, UserProfile, UserDepartment } from '../interfaces/user.interface';

export class CreateUserDto {
  @ApiProperty({ description: 'User login', example: 'john.doe' })
  login: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  password: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'User email', example: 'john@example.com' })
  email: string;

  @ApiProperty({ description: 'User contact number', example: '+5511999999999' })
  contact: string;

  @ApiProperty({ description: 'User profile picture URL', required: false })
  profilePicture?: string;

  @ApiProperty({ description: 'User status', enum: UserStatus, default: UserStatus.ACTIVE })
  status?: UserStatus;

  @ApiProperty({ description: 'User profile', enum: UserProfile })
  profile: UserProfile;

  @ApiProperty({ description: 'User department', enum: UserDepartment })
  department: UserDepartment;
}

export class UpdateUserDto {
  @ApiProperty({ description: 'User login', required: false })
  login?: string;

  @ApiProperty({ description: 'User password', required: false })
  password?: string;

  @ApiProperty({ description: 'User full name', required: false })
  name?: string;

  @ApiProperty({ description: 'User email', required: false })
  email?: string;

  @ApiProperty({ description: 'User contact number', required: false })
  contact?: string;

  @ApiProperty({ description: 'User profile picture URL', required: false })
  profilePicture?: string;

  @ApiProperty({ description: 'User status', enum: UserStatus, required: false })
  status?: UserStatus;

  @ApiProperty({ description: 'User profile', enum: UserProfile, required: false })
  profile?: UserProfile;

  @ApiProperty({ description: 'User department', enum: UserDepartment, required: false })
  department?: UserDepartment;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User login' })
  login: string;

  @ApiProperty({ description: 'User full name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User contact number' })
  contact: string;

  @ApiProperty({ description: 'User profile picture URL', required: false })
  profilePicture?: string;

  @ApiProperty({ description: 'User status', enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ description: 'User profile', enum: UserProfile })
  profile: UserProfile;

  @ApiProperty({ description: 'User department', enum: UserDepartment })
  department: UserDepartment;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
} 