import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { signToken } from '../../../lib/jwt';
import { authenticateAdmin, adminCookieOptions } from '../../../middleware/auth';
import { loginLimiter } from '../../../middleware/rateLimiter';
import { validateBody } from '../../../middleware/validate';
import { asyncHandler, UnauthorizedError } from '../../../middleware/error';
import { AdminLoginSchema } from '@oofy/shared';

const router = Router();

router.post(
  '/login',
  loginLimiter,
  validateBody(AdminLoginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) throw new UnauthorizedError('Invalid credentials');

    const token = signToken({ adminId: admin.id, email: admin.email });
    res.cookie('admin_token', token, adminCookieOptions());

    res.json({
      success: true,
      data: {
        admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      },
    });
  }),
);

router.post(
  '/logout',
  authenticateAdmin,
  asyncHandler((req, res) => {
    res.clearCookie('admin_token', adminCookieOptions());
    res.json({ success: true, message: 'Logged out successfully' });
  }),
);

router.get(
  '/me',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const admin = await prisma.admin.findUnique({
      where: { id: (req as any).admin!.id },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ success: true, data: { admin } });
  }),
);

export { router as authRouter };
