import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { authenticateAdmin } from '../../../middleware/auth';
import { getSettings } from '../../../lib/helpers';
import { validateBody } from '../../../middleware/validate';
import { asyncHandler } from '../../../middleware/error';
import { StoreSettingsSchema } from '@oofy/shared';

const router = Router();

router.get(
  '/',
  authenticateAdmin,
  asyncHandler(async (_req, res) => {
    const settings = await getSettings();
    res.json({ success: true, data: settings });
  }),
);

router.patch(
  '/',
  authenticateAdmin,
  validateBody(StoreSettingsSchema),
  asyncHandler(async (req, res) => {
    const updates = req.body as Record<string, unknown>;

    await prisma.$transaction(
      Object.entries(updates).map(([key, value]) =>
        prisma.storeSetting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        }),
      ),
    );

    const settings = await getSettings();
    res.json({ success: true, data: settings, message: 'Settings updated' });
  }),
);

export { router as settingsRouter };
