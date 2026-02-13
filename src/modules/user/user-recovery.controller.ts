import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PasswordRecoveryService } from './password-recovery.service';
import { SendRecoverPasswordDto, ValidateRecoverCodeDto, RecoverPasswordDto } from './dto/user.dto';

@ApiTags('Users')
@Controller('user')
export class UserRecoveryController {
  constructor(private readonly passwordRecoveryService: PasswordRecoveryService) {}

  @Post('send-recover-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password recovery code by email' })
  @ApiResponse({ status: 200, description: 'If the email is registered, a recovery code will be sent.' })
  @ApiResponse({ status: 503, description: 'Email service temporarily unavailable' })
  async sendRecoverPassword(@Body() dto: SendRecoverPasswordDto) {
    return this.passwordRecoveryService.sendRecoveryCode(dto.email);
  }

  @Post('validate-recover-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate recovery code before proceeding to set new password' })
  @ApiResponse({
    status: 200,
    description: 'Code is valid',
    schema: { type: 'object', properties: { valid: { type: 'boolean', example: true } } },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired recovery code' })
  async validateRecoverCode(@Body() dto: ValidateRecoverCodeDto) {
    return this.passwordRecoveryService.validateRecoveryCode(dto.email, dto.code);
  }

  @Post('recover-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using recovery code' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired recovery code' })
  async recoverPassword(@Body() dto: RecoverPasswordDto) {
    return this.passwordRecoveryService.recoverPassword(dto.email, dto.code, dto.newPassword);
  }
}
