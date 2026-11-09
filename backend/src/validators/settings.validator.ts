import { z } from 'zod';

export const settingsUpdateSchema = z.object({
  body: z.object({
    storeName: z.string().min(1).optional(),
    storeTagline: z.string().min(1).optional(),
    contactEmail: z.string().email('Invalid email').optional(),
    deliveryCharge: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid delivery charge')
      .optional(),
    freeShippingThreshold: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid threshold')
      .optional()
      .nullable(),
    codEnabled: z.boolean().optional(),
  }),
});