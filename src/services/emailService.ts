import nodemailer from 'nodemailer';
import { config } from '@config';
import logger from '@utils/logger';

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  if (!config.email.smtpHost || !config.email.smtpUser || !config.email.smtpPassword) {
    throw new Error('SMTP configuration is incomplete');
  }

  transporter = nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpPort === 465,
    auth: {
      user: config.email.smtpUser,
      pass: config.email.smtpPassword,
    },
  });

  return transporter;
}

function buildResetUrl(email: string, token: string): string {
  const baseUrl = config.app.frontendUrl.replace(/\/$/, '');
  const params = new URLSearchParams({ email, token });
  return `${baseUrl}/reset-password?${params.toString()}`;
}

export class EmailService {
  static async sendMail(payload: MailPayload): Promise<void> {
    const client = getTransporter();

    await client.sendMail({
      from: config.email.smtpFrom,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  }

  static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = buildResetUrl(email, token);

    const text = [
      'You requested a password reset for your AssetFlow account.',
      '',
      `Reset your password here: ${resetUrl}`,
      '',
      'This link expires in 1 hour.',
      'If you did not request this reset, you can ignore this email.',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin: 0 0 16px;">Reset your AssetFlow password</h2>
        <p>You requested a password reset for your AssetFlow account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, copy and paste this URL into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request this reset, you can ignore this email.</p>
      </div>
    `;

    try {
      await EmailService.sendMail({
        to: email,
        subject: 'AssetFlow password reset',
        text,
        html,
      });
      logger.info('Password reset email sent', { email });
    } catch (error) {
      logger.error('Failed to send password reset email', error, { email });
      throw error;
    }
  }
}