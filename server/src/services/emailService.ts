import { Resend } from 'resend';
import { config } from '../config/env';

// Only instantiate the Resend client if an API key is configured
const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

const FROM_EMAIL = config.fromEmail;
const CLIENT_URL = config.clientUrl;

export async function sendVerificationEmail(
  email: string,
  name: string | null,
  token: string
): Promise<void> {
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;
  const greeting = name ? `Hi ${name},` : 'Hi,';

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#DC2626;">Verify your email</h2>
      <p>${greeting}</p>
      <p>Thanks for signing up for Thi Thi. Please verify your email address to start ordering.</p>
      <a href="${verifyUrl}"
         style="display:inline-block;padding:12px 24px;background:#DC2626;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
        Verify Email
      </a>
      <p style="color:#6b7280;font-size:14px;">Or copy this link: ${verifyUrl}</p>
      <p style="color:#6b7280;font-size:14px;">This link expires in 24 hours.</p>
    </div>
  `;

  if (!resend) {
    // DEV fallback: print the link to the terminal
    console.log('\n  DEV: Verification Email');
    console.log(`  To:    ${email}`);
    console.log(`  Link:  ${verifyUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Verify your email — Thi Thi',
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string | null,
  token: string
): Promise<void> {
  const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;
  const greeting = name ? `Hi ${name},` : 'Hi,';

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#DC2626;">Reset your password</h2>
      <p>${greeting}</p>
      <p>Click the button below to choose a new password.</p>
      <a href="${resetUrl}"
         style="display:inline-block;padding:12px 24px;background:#DC2626;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
        Reset Password
      </a>
      <p style="color:#6b7280;font-size:14px;">This link expires in 1 hour.</p>
      <p style="color:#6b7280;font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  if (!resend) {
    // DEV fallback: print the link to the terminal
    console.log('\n  DEV: Password Reset Email');
    console.log(`  To:    ${email}`);
    console.log(`  Link:  ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset your password — Thi Thi',
    html,
  });
}
