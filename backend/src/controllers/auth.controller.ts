import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { validate } from '../middlewares/validate.middleware';
import { adminLoginSchema } from '../validators/auth.validator';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export const adminLogin = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const parsed = adminLoginSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      throw new ApiError(400, 'Invalid credentials');
    }
    const { email, password } = parsed.data.body;

    const admin = await db.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as import('jsonwebtoken').SignOptions
    );

    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      },
    });
  }
);

export const adminLogout = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    res.clearCookie('token', { path: '/', ...(process.env.NODE_ENV === 'production' ? { secure: true } : {}) });
    res.json({ success: true, message: 'Logged out' });
  }
);

export const adminMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const token = req.cookies?.token;
    if (!token) {
      throw new ApiError(401, 'Unauthorized');
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: string };
      const admin = await db.admin.findUnique({ where: { id: decoded.id } });
      if (!admin) {
        throw new ApiError(401, 'Unauthorized');
      }
      res.json({
        success: true,
        data: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      });
    } catch {
      throw new ApiError(401, 'Unauthorized');
    }
  }
);

export const seedAdmin = async (): Promise<void> => {
  const existing = await db.admin.findUnique({ where: { email: env.ADMIN_EMAIL } });
  if (existing) return;
  const hashed = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  await db.admin.create({
    data: { email: env.ADMIN_EMAIL, password: hashed, name: 'OOFY Admin', role: 'ADMIN' },
  });
};