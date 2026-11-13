import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';

export function parseStoreSettings(s: any) {
  if (!s) {
    return {
      storeName: 'OOFY',
      storeTagline: 'Wear Your Confidence',
      contactEmail: 'oofybrand@gmail.com',
      deliveryCharge: 60,
      deliveryChargeInsideDhaka: 60,
      deliveryChargeOutsideDhaka: 100,
      freeShippingThreshold: 2000,
      customAnnouncement: '',
      codEnabled: true,
    };
  }

  const rawTagline = s.storeTagline || 'Wear Your Confidence';

  const outsideMatch = rawTagline.match(/\[OUTSIDE_DHAKA:(\d+)\]/);
  const deliveryChargeOutsideDhaka = outsideMatch ? Number(outsideMatch[1]) : 100;

  const announcementMatch = rawTagline.match(/\[ANNOUNCEMENT:([^\]]+)\]/);
  const customAnnouncement = announcementMatch ? announcementMatch[1] : '';

  const cleanTagline = rawTagline
    .replace(/\[OUTSIDE_DHAKA:\d+\]/g, '')
    .replace(/\[ANNOUNCEMENT:[^\]]+\]/g, '')
    .trim() || 'Wear Your Confidence';

  return {
    ...s,
    deliveryCharge: Number(s.deliveryCharge ?? 60),
    deliveryChargeInsideDhaka: Number(s.deliveryCharge ?? 60),
    deliveryChargeOutsideDhaka,
    customAnnouncement,
    storeTagline: cleanTagline,
  };
}

export const getSettings = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const settings = await db.storeSettings.findFirst();
    res.json({ success: true, data: parseStoreSettings(settings) });
  }
);

export const updateSettings = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const existing = await db.storeSettings.findFirst();

    const {
      deliveryChargeOutsideDhaka,
      customAnnouncement,
      storeTagline,
      deliveryChargeInsideDhaka,
      deliveryCharge,
      freeShippingThreshold,
      ...rest
    } = req.body;

    let packedTagline = (storeTagline || existing?.storeTagline || 'Wear Your Confidence')
      .replace(/\[OUTSIDE_DHAKA:\d+\]/g, '')
      .replace(/\[ANNOUNCEMENT:[^\]]+\]/g, '')
      .trim();

    const outsideCharge =
      deliveryChargeOutsideDhaka !== undefined && deliveryChargeOutsideDhaka !== ''
        ? Number(deliveryChargeOutsideDhaka)
        : 100;
    packedTagline += ` [OUTSIDE_DHAKA:${outsideCharge}]`;

    if (customAnnouncement && customAnnouncement.trim()) {
      packedTagline += ` [ANNOUNCEMENT:${customAnnouncement.trim()}]`;
    }

    const finalInsideCharge =
      deliveryChargeInsideDhaka !== undefined && deliveryChargeInsideDhaka !== ''
        ? Number(deliveryChargeInsideDhaka)
        : deliveryCharge !== undefined && deliveryCharge !== ''
        ? Number(deliveryCharge)
        : 60;

    const dataToSave: any = {
      ...rest,
      storeTagline: packedTagline,
      deliveryCharge: finalInsideCharge,
    };

    if (freeShippingThreshold !== undefined) {
      dataToSave.freeShippingThreshold =
        freeShippingThreshold === '' || freeShippingThreshold === null
          ? null
          : Number(freeShippingThreshold);
    }

    let settings;
    if (existing) {
      settings = await db.storeSettings.update({
        where: { id: existing.id },
        data: dataToSave,
      });
    } else {
      settings = await db.storeSettings.create({ data: dataToSave });
    }
    res.json({ success: true, data: parseStoreSettings(settings) });
  }
);
