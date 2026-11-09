import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';

export const getSettings = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const settings = await db.storeSettings.findFirst();
    res.json({ success: true, data: settings ?? {} });
  }
);

export const updateSettings = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const existing = await db.storeSettings.findFirst();
    let settings;
    if (existing) {
      settings = await db.storeSettings.update({
        where: { id: existing.id },
        data: req.body,
      });
    } else {
      settings = await db.storeSettings.create({ data: req.body as any });
    }
    res.json({ success: true, data: settings });
  }
);