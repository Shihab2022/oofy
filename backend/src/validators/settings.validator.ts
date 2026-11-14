import { z } from 'zod';

const numericField = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : String(val)),
  z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid number').optional()
);

const nullableNumericField = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? null : String(val)),
  z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid number').nullable().optional()
);

export const settingsUpdateSchema = z.object({
  body: z.object({
    storeName: z.string().min(1).optional(),
    storeTagline: z.string().optional(),
    contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    deliveryCharge: numericField,
    deliveryChargeInsideDhaka: numericField,
    deliveryChargeOutsideDhaka: numericField,
    cityDeliveryRates: z.record(z.string(), z.coerce.number()).optional(),
    freeShippingThreshold: nullableNumericField,
    codEnabled: z.boolean().optional(),
    showAnnouncement: z.boolean().or(z.string()).optional(),
    customAnnouncement: z.string().optional(),
  }).passthrough(),
});
