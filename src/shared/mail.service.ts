import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Builds the HTML body for the password recovery email (Lar de Maria template).
 */
function buildPasswordRecoveryHtml(recipientName: string, code: string, logoUrl: string): string {
  const logoImg = logoUrl
    ? `<img src="${logoUrl}" alt="Lar de Maria" style="max-width: 200px; margin-bottom: 24px;" />`
    : '<p style="font-size: 20px; font-weight: bold; margin-bottom: 24px;">Lar de Maria</p>';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center;">
    ${logoImg}
  </div>
  <p>Olá ${recipientName},</p>
  <p>Recebemos sua solicitação de recuperação de senha para acesso à plataforma operacional. Para redefinir sua senha, por favor utilize o seguinte código de validação:</p>
  <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 24px 0;">${code}</p>
  <p>Se você não solicitou essa redefinição de senha, por favor, ignore este e-mail e entre em contato conosco imediatamente para proteger sua conta contra possíveis atividades fraudulentas.</p>
  <p>Atenciosamente,</p>
  <p><strong>Lar de Maria</strong></p>
</body>
</html>
  `.trim();
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null = null;
  private readonly mailFrom: string;
  private readonly logoUrl: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS') ?? this.configService.get<string>('SMTP_PASSWORD');
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    this.mailFrom = this.configService.get<string>('MAIL_FROM') ?? this.configService.get<string>('SMTP_FROM_EMAIL') ?? 'Lar de Maria <noreply@lardemaria.com.br>';
    this.logoUrl = this.configService.get<string>('MAIL_LOGO_URL', '');
    if (host && port !== undefined) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure,
        auth: user && pass ? { user, pass } : undefined,
      });
    } else {
      this.logger.warn('SMTP not configured (SMTP_HOST/SMTP_PORT missing). Password recovery emails will fail.');
    }
  }

  /**
   * Sends the password recovery email with the given validation code.
   * @throws Error if SMTP is not configured or sending fails
   */
  async sendPasswordRecoveryEmail(to: string, recipientName: string, code: string): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP is not configured. Set SMTP_HOST and SMTP_PORT to enable password recovery emails.');
    }
    const html = buildPasswordRecoveryHtml(recipientName, code, this.logoUrl);
    const subject = 'Recuperação de senha - Lar de Maria';
    try {
      await this.transporter.sendMail({
        from: this.mailFrom,
        to,
        subject,
        html,
      });
      this.logger.log(`Password recovery email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password recovery email to ${to}:`, error);
      throw error;
    }
  }
}
