import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { User, UserStatus, UserProfile } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(login: string, password: string): Promise<User | null> {
    const user = await this.userService.findUserByLogin(login);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(login: string, password: string) {
    const user = await this.validateUser(login, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is inactive');
    }

    const payload = { 
      sub: user.id, 
      login: user.login,
      profile: user.profile,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        email: user.email,
        contact: user.contact,
        profile: user.profile,
        status: user.status,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findUserById(payload.sub);

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { 
        sub: user.id, 
        login: user.login,
        profile: user.profile,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '24h',
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 24 * 60 * 60,
        user: {
          id: user.id,
          login: user.login,
          name: user.name,
          email: user.email,
          contact: user.contact,
          profile: user.profile,
          status: user.status,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userService.findUserById(payload.sub);

      if (!user || user.status !== UserStatus.ACTIVE) {
        return { valid: false };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          login: user.login,
          name: user.name,
          email: user.email,
          contact: user.contact,
          profile: user.profile,
          status: user.status,
        },
      };
    } catch (error) {
      return { valid: false };
    }
  }

  async logout(userId: string) {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    return { message: 'Logged out successfully' };
  }
} 