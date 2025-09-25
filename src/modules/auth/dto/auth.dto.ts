import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'User login', example: 'ubc.supervisor' })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ description: 'User password', example: '123456Ab!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ValidateTokenDto {
  @ApiProperty({ description: 'JWT token to validate' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expiresIn: number;

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    login: string;
    name: string;
    email: string;
    contact: string;
    profile: string;
    status: string;
  };
}

export class ValidateResponseDto {
  @ApiProperty({ description: 'Token validity status' })
  valid: boolean;

  @ApiProperty({ description: 'User information if token is valid' })
  user?: {
    id: string;
    login: string;
    name: string;
    email: string;
    contact: string;
    profile: string;
    status: string;
  };
} 