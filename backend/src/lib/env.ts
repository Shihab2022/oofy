import dotenv from 'dotenv';
import path from 'path';
// Load backend/.env first, then fall back to the monorepo root .env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  BACKEND_URL: z.string().url().optional(),
  ADMIN_NAME: z.string().default('OOFY Admin'),
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email address'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),
  COMPANY_NAME: z.string().default('OOFY'),
  COMPANY_EMAIL: z.string().email('COMPANY_EMAIL must be a valid email address'),
  COMPANY_PHONE: z.string().default(''),
  COMPANY_ADDRESS: z.string().default('Dhaka, Bangladesh'),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().default('587').transform((v) => parseInt(v, 10)),
  SMTP_SECURE: z.string().default('false').transform((v) => v === 'true'),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  SMTP_FROM_NAME: z.string().default('OOFY'),
  SMTP_FROM_EMAIL: z.string().email('SMTP_FROM_EMAIL must be a valid email address'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters'),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  DELIVERY_FEE_DHAKA: z.string().default('80').transform((v) => parseInt(v, 10)),
  DELIVERY_FEE_OUTSIDE_DHAKA: z.string().default('130').transform((v) => parseInt(v, 10)),
  BKASH_ENABLED: z.string().default('false').transform((v) => v === 'true'),
  NAGAD_ENABLED: z.string().default('false').transform((v) => v === 'true'),
});

const _parsed = envSchema.safeParse(process.env);
if (!_parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _parsed.data;
export const isProduction = () => env.NODE_ENV === 'production';
export const isDevelopment = () => env.NODE_ENV === 'development';
