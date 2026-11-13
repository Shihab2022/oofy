import { z } from 'zod';

const phoneRegex = /^(?:\+?880|880|0)?1[3-9]\d{8}$/;

export const orderCreateSchema = z.object({
  body: z.object({
    customerName: z.string().min(2, 'Full name is required'),
    customerPhone: z
      .string()
      .min(10, 'Enter a valid phone number')
      .transform((val) => val.replace(/[\s\-]/g, ''))
      .refine((val) => phoneRegex.test(val), {
        message: 'Enter a valid Bangladesh phone number (e.g. 01XXXXXXXXX)',
      }),
    customerEmail: z
      .string()
      .email('Enter a valid email address')
      .optional()
      .or(z.literal(''))
      .nullable(),
    address: z.string().min(5, 'Full delivery address is required'),
    district: z.string().min(1, 'District is required'),
    area: z.string().min(1, 'Area / Upazila is required'),
    orderNotes: z.string().optional().nullable(),
    paymentMethod: z.enum(['COD', 'BKASH', 'NAGAD']).default('COD'),
    paymentNumber: z.string().optional().nullable(),
    transactionId: z.string().optional().nullable(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product is required'),
          variantId: z.string().optional().nullable(),
          quantity: z.number().int().positive('Quantity must be at least 1'),
          size: z.string().min(1, 'Size is required'),
          color: z.string().optional().nullable(),
        })
      )
      .min(1, 'At least one item is required'),
  }),
});

export const orderStatusSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid order id') }),
  body: z.object({
    status: z.enum([
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ]),
  }),
});
