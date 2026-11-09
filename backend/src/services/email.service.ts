import nodemailer from 'nodemailer';
import { env } from '../config/env';

export interface EmailSettingsData {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail?: string;
  fromName?: string;
  isActive?: boolean;
}

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedSettings: EmailSettingsData | null = null;

export function buildTransporter(settings?: EmailSettingsData) {
  const s = settings ?? {
    smtpHost: env.SMTP_HOST,
    smtpPort: env.SMTP_PORT,
    smtpUser: env.SMTP_USER,
    smtpPass: env.SMTP_PASS,
    fromEmail: env.SMTP_FROM,
    fromName: env.SMTP_FROM_NAME,
  };

  const changed =
    !cachedTransporter ||
    JSON.stringify(cachedSettings) !== JSON.stringify(s);

  if (!changed && cachedTransporter) return cachedTransporter;

  const transporter = nodemailer.createTransport({
    host: s.smtpHost,
    port: s.smtpPort,
    secure: s.smtpPort === 465,
    auth: s.smtpUser && s.smtpPass ? { user: s.smtpUser, pass: s.smtpPass } : undefined,
  });

  cachedTransporter = transporter;
  cachedSettings = s;
  return transporter;
}

function fromAddress(settings?: EmailSettingsData) {
  const s = settings ?? {
    fromEmail: env.SMTP_FROM,
    fromName: env.SMTP_FROM_NAME,
  };
  return `"${s.fromName || env.SMTP_FROM_NAME}" <${s.fromEmail || env.SMTP_FROM}>`;
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderNumber: string,
  customerName: string,
  totalAmount: number,
  settings?: EmailSettingsData
): Promise<void> {
  const transporter = buildTransporter(settings);
  await transporter.sendMail({
    from: fromAddress(settings),
    to,
    subject: `OOFY - Order Confirmed (${orderNumber})`,
    html: `
      <div style="font-family:sans-serif;background:#111;color:#F5F2E9;padding:24px;">
        <div style="max-width:600px;margin:0 auto;background:#0B5D45;border-radius:12px;padding:32px;">
          <h1 style="margin:0 0 16px;font-size:22px;text-transform:uppercase;letter-spacing:1px;">OOFY</h1>
          <p style="margin:0 0 24px;">Hi ${customerName},</p>
          <p style="margin:0 0 12px;">Thank you for shopping with us. Your order has been received.</p>
          <p style="margin:0 0 24px;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin:0 0 24px;"><strong>Total Payable:</strong> ৳${totalAmount.toFixed(2)}</p>
          <p style="margin:0 0 24px;"><strong>Payment Method:</strong> Cash on Delivery</p>
          <p style="margin:0;">We will contact you shortly to confirm delivery details.</p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;" />
          <p style="margin:0;font-size:13px;opacity:0.8;">Wear Your Confidence — OOFY</p>
        </div>
      </div>
    `,
  });
}

export async function sendOrderNotificationEmail(
  orderNumber: string,
  customerName: string,
  customerPhone: string,
  totalAmount: number,
  itemsCount: number,
  settings?: EmailSettingsData
): Promise<void> {
  const transporter = buildTransporter(settings);
  const to = env.COMPANY_EMAIL;
  await transporter.sendMail({
    from: fromAddress(settings),
    to,
    subject: `New OOFY Order - ${orderNumber}`,
    html: `
      <div style="font-family:sans-serif;background:#111;color:#F5F2E9;padding:24px;">
        <div style="max-width:600px;margin:0 auto;background:#0B5D45;border-radius:12px;padding:32px;">
          <h1 style="margin:0 0 16px;font-size:22px;text-transform:uppercase;letter-spacing:1px;">OOFY</h1>
          <p style="margin:0 0 12px;">New order received.</p>
          <p style="margin:0 0 24px;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin:0 0 8px;"><strong>Customer:</strong> ${customerName}</p>
          <p style="margin:0 0 8px;"><strong>Phone:</strong> ${customerPhone}</p>
          <p style="margin:0 0 8px;"><strong>Items:</strong> ${itemsCount}</p>
          <p style="margin:0 0 24px;"><strong>Total:</strong> ৳${totalAmount.toFixed(2)} (Cash on Delivery)</p>
          <p style="margin:0;">Please process and ship this order.</p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;" />
          <p style="margin:0;font-size:13px;opacity:0.8;">Wear Your Confidence — OOFY</p>
        </div>
      </div>
    `,
  });
}