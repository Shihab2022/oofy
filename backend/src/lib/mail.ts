import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { env } from './env';

export type EmailType = 'ORDER_ADMIN' | 'ORDER_CUSTOMER' | 'CONTACT';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  type: EmailType;
}) {
  const { to, subject, html, type } = options;
  let status = 'SENT';
  let error: string | null = null;

  const transporter = getTransporter();
  if (!transporter) {
    status = 'FAILED';
    error = 'SMTP is not configured';
    console.warn('[mail] SMTP not configured. Skipping email:', subject);
  } else {
    try {
      await transporter.sendMail({
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
        to,
        subject,
        html,
      });
    } catch (err: any) {
      status = 'FAILED';
      error = err?.message ?? String(err);
      console.error('[mail] Failed to send email:', subject, error);
    }
  }

  // Never throw — order creation must not roll back because of email failure.
  try {
    await prisma.emailLog.create({ data: { to, subject, type, status, error } });
  } catch (err) {
    console.error('[mail] Failed to write email log:', err);
  }

  return { status, error };
}
