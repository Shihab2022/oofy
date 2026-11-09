import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

export const sendContactMessage = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { name, phone, email, message } = req.body;

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });

    await transporter.sendMail({
      from: `"OOFY Contact" <${env.SMTP_FROM}>`,
      to: env.COMPANY_EMAIL,
      subject: `OOFY Contact Form - ${name}`,
      html: `
        <div style="font-family:sans-serif;background:#111;color:#F5F2E9;padding:24px;">
          <div style="max-width:600px;margin:0 auto;background:#0B5D45;border-radius:12px;padding:32px;">
            <h1 style="margin:0 0 16px;font-size:20px;text-transform:uppercase;letter-spacing:1px;">OOFY — Contact Form</h1>
            <p style="margin:0 0 8px;"><strong>Name:</strong> ${name}</p>
            <p style="margin:0 0 8px;"><strong>Phone:</strong> ${phone}</p>
            <p style="margin:0 0 8px;"><strong>Email:</strong> ${email || '—'}</p>
            <p style="margin:0 0 24px;"><strong>Message:</strong></p>
            <p style="margin:0;white-space:pre-wrap;">${message}</p>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;" />
            <p style="margin:0;font-size:13px;opacity:0.8;">Wear Your Confidence — OOFY</p>
          </div>
        </div>
      `,
    });

    res.json({ success: true, message: 'Message sent' });
  }
);