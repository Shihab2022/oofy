import cookieParser from 'cookie-parser';
import { NextFunction, Request, Response } from 'express';
import { verifyToken, type JwtPayload } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { UnauthorizedError } from './error';

export const parseCookies = cookieParser();

export interface AuthRequest extends Request {
  admin?: { id: string; email: string; role: string };
}

export async function authenticateAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.admin_token;
  if (!token) return next(new UnauthorizedError('Authentication required'));

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(new UnauthorizedError('Invalid or expired session'));
  }

  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    return next(new UnauthorizedError('Admin account not found or inactive'));
  }

  req.admin = { id: admin.id, email: admin.email, role: admin.role };
  next();
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  };
}
