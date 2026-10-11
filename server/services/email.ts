import nodemailer from 'nodemailer';
import crypto from 'crypto';

export interface SentEmailRecord {
  id: string;
  to: string;
  subject: string;
  type: 'registration_verification' | 'email_change_verification' | 'email_change_alert' | 'email_change_completed';
  otp?: string;
  token?: string;
  verificationUrl?: string;
  sentAt: string;
}

// In-memory record of recent emails for dev testing and inspection
const recentEmails: SentEmailRecord[] = [];

// Create SHA-256 hash of OTP or token for secure database storage
export function hashToken(secret: string): string {
  return crypto.createHash('sha256').update(secret.trim()).digest('hex');
}

// Generate secure 6-digit numeric OTP and 32-byte alphanumeric verification token
export function generateVerificationSecrets(): { otp: string; token: string; otpHash: string; tokenHash: string } {
  const otp = crypto.randomInt(100000, 999999).toString();
  const token = crypto.randomBytes(32).toString('hex');
  const otpHash = hashToken(otp);
  const tokenHash = hashToken(token);
  return { otp, token, otpHash, tokenHash };
}

// Create Nodemailer Transporter
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
  }

  // Fallback dev transporter: prints email to console
  return {
    sendMail: async (mailOptions: any) => {
      console.log('----------------------------------------------------');
      console.log(`[QueueCare Email Service] Sending to: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log('----------------------------------------------------');
      return { messageId: `mock_${Date.now()}` };
    },
  };
}

class EmailService {
  private getAppUrl(): string {
    return process.env.APP_URL || 'http://localhost:3000';
  }

  private getFromAddress(): string {
    return process.env.SMTP_FROM || 'QueueCare Health <noreply@queuecare.org>';
  }

  // 1. Send Registration Email Verification
  async sendRegistrationVerificationEmail(email: string, name: string, otp: string, token: string): Promise<void> {
    const appUrl = this.getAppUrl();
    const verificationUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    const html = `
      <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0d9488 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">QueueCare</h1>
          <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.9;">Less Wait · More Care</p>
        </div>
        
        <div style="padding: 32px 28px; color: #1e293b; line-height: 1.6;">
          <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #0f172a;">Verify Your Email Address</h2>
          <p style="font-size: 14px; color: #475569;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #475569;">
            Thank you for registering with QueueCare. To activate your patient account and unlock appointment booking with verified doctors, please verify your email address.
          </p>
          
          <div style="margin: 28px 0; padding: 20px; background: #f0fdfa; border: 1.5px dashed #0d9488; border-radius: 16px; text-align: center;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #0d9488; display: block; margin-bottom: 6px;">Your 6-Digit Verification Code</span>
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">${otp}</span>
            <p style="font-size: 11px; color: #64748b; margin: 8px 0 0 0;">This code will expire in <strong>15 minutes</strong>.</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${verificationUrl}" style="display: inline-block; background: #0d9488; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.2);">
              Or Click Here to Verify Instantly
            </a>
          </div>
          
          <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; pt: 16px;">
            If you did not create an account on QueueCare, please disregard this email.
          </p>
        </div>
      </div>
    `;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: this.getFromAddress(),
      to: email,
      subject: 'Verify your QueueCare account - Less Wait · More Care',
      html,
    });

    recentEmails.unshift({
      id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      to: email,
      subject: 'Verify your QueueCare account',
      type: 'registration_verification',
      otp,
      token,
      verificationUrl,
      sentAt: new Date().toISOString(),
    });

    if (recentEmails.length > 50) recentEmails.pop();
  }

  // 2. Send Email Change Verification (Sent to the NEW email address)
  async sendEmailChangeVerificationEmail(newEmail: string, name: string, otp: string, token: string): Promise<void> {
    const appUrl = this.getAppUrl();
    const verificationUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(newEmail)}&mode=email_change`;

    const html = `
      <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0d9488 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">QueueCare</h1>
          <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.9;">Less Wait · More Care</p>
        </div>
        
        <div style="padding: 32px 28px; color: #1e293b; line-height: 1.6;">
          <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #0f172a;">Confirm Your New Email Address</h2>
          <p style="font-size: 14px; color: #475569;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #475569;">
            You requested to change your QueueCare account email address to <strong>${newEmail}</strong>. To complete this change and activate this email, enter the verification code below:
          </p>
          
          <div style="margin: 28px 0; padding: 20px; background: #f0fdfa; border: 1.5px dashed #0d9488; border-radius: 16px; text-align: center;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #0d9488; display: block; margin-bottom: 6px;">Email Change Verification Code</span>
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">${otp}</span>
            <p style="font-size: 11px; color: #64748b; margin: 8px 0 0 0;">This code is valid for <strong>15 minutes</strong>.</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${verificationUrl}" style="display: inline-block; background: #0d9488; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.2);">
              Or Click Here to Confirm New Email
            </a>
          </div>
          
          <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; pt: 16px;">
            Your previous email remains active until this verification is successfully completed.
          </p>
        </div>
      </div>
    `;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: this.getFromAddress(),
      to: newEmail,
      subject: 'Confirm your new QueueCare email address',
      html,
    });

    recentEmails.unshift({
      id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      to: newEmail,
      subject: 'Confirm your new QueueCare email address',
      type: 'email_change_verification',
      otp,
      token,
      verificationUrl,
      sentAt: new Date().toISOString(),
    });

    if (recentEmails.length > 50) recentEmails.pop();
  }

  // 3. Send Notification Alert to OLD Email Address when change is requested
  async sendEmailChangeAlertToOldEmail(oldEmail: string, newEmail: string, name: string): Promise<void> {
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">
        <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">QueueCare Security Alert</h1>
        </div>
        
        <div style="padding: 28px; color: #1e293b; line-height: 1.6;">
          <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #b91c1c;">Security Notice: Email Change Requested</h2>
          <p style="font-size: 14px; color: #475569;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #475569;">
            We received a request to change the email address associated with your QueueCare account to <strong>${newEmail}</strong>.
          </p>
          <p style="font-size: 13px; color: #475569;">
            Your current email address (<strong>${oldEmail}</strong>) remains your active login until the new address is verified with a secure code.
          </p>
          
          <div style="margin: 20px 0; padding: 16px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; color: #9f1239; font-size: 12px;">
            <strong>Did not request this change?</strong><br />
            If you did not authorize this request, please log in immediately to cancel the pending change, update your password, or contact QueueCare support at support@queuecare.org.
          </div>
        </div>
      </div>
    `;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: this.getFromAddress(),
      to: oldEmail,
      subject: 'Security Alert: Email change requested for your QueueCare account',
      html,
    });

    recentEmails.unshift({
      id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      to: oldEmail,
      subject: 'Security Alert: Email change requested',
      type: 'email_change_alert',
      sentAt: new Date().toISOString(),
    });
  }

  // 4. Send Confirmation when email change is COMPLETED
  async sendEmailChangeCompletedNotification(oldEmail: string, newEmail: string, name: string): Promise<void> {
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0d9488 100%); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">QueueCare</h1>
        </div>
        
        <div style="padding: 28px; color: #1e293b; line-height: 1.6;">
          <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #047857;">Email Address Successfully Updated</h2>
          <p style="font-size: 14px; color: #475569;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #475569;">
            Your QueueCare account email address has been successfully updated to <strong>${newEmail}</strong>.
          </p>
          <p style="font-size: 13px; color: #64748b;">
            All future appointment confirmations, queue tokens, and healthcare updates will be delivered to your new verified email.
          </p>
        </div>
      </div>
    `;

    const transporter = getTransporter();
    await Promise.all([
      transporter.sendMail({
        from: this.getFromAddress(),
        to: oldEmail,
        subject: 'Your QueueCare account email address has been changed',
        html,
      }),
      transporter.sendMail({
        from: this.getFromAddress(),
        to: newEmail,
        subject: 'Your QueueCare account email address is confirmed and active',
        html,
      }),
    ]);

    recentEmails.unshift({
      id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      to: `${oldEmail}, ${newEmail}`,
      subject: 'Email Change Completed',
      type: 'email_change_completed',
      sentAt: new Date().toISOString(),
    });
  }

  // Get recent emails (used by testing suite and dev inspector)
  getRecentEmails(): SentEmailRecord[] {
    return recentEmails;
  }
}

export const emailService = new EmailService();
