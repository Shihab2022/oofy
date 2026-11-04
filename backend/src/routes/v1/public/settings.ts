import { Router } from 'express';
import { prisma } from '../../../lib/prisma';
import { getSetting, getSettings } from '../../../lib/helpers';
import { env } from '../../../lib/env';
import { asyncHandler } from '../../../middleware/error';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await getSettings();
    const deliveryFeeDhaka = settings.deliveryFeeDhaka ?? String(env.DELIVERY_FEE_DHAKA);
    const deliveryFeeOutsideDhaka =
      settings.deliveryFeeOutsideDhaka ?? String(env.DELIVERY_FEE_OUTSIDE_DHAKA);

    res.json({
      success: true,
      data: {
        companyName: settings.companyName ?? env.COMPANY_NAME,
        companyEmail: settings.companyEmail ?? env.COMPANY_EMAIL,
        companyPhone: settings.companyPhone ?? env.COMPANY_PHONE,
        companyAddress: settings.companyAddress ?? env.COMPANY_ADDRESS,
        whatsappNumber: settings.whatsappNumber ?? undefined,
        facebookUrl: settings.facebookUrl ?? undefined,
        instagramUrl: settings.instagramUrl ?? undefined,
        tiktokUrl: settings.tiktokUrl ?? undefined,
        announcementText:
          settings.announcementText ?? 'Delivery available all over Bangladesh',
        returnPolicy: settings.returnPolicy ?? null,
        deliveryFeeDhaka: Number(deliveryFeeDhaka),
        deliveryFeeOutsideDhaka: Number(deliveryFeeOutsideDhaka),
        codEnabled: settings.codEnabled !== 'false',
        bkashEnabled: settings.bkashEnabled === 'true' && env.BKASH_ENABLED,
        nagadEnabled: settings.nagadEnabled === 'true' && env.NAGAD_ENABLED,
      },
    });
  }),
);

export { router as settingsRouter };
