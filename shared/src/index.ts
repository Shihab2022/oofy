/**
 * @oofy/shared
 *
 * Shared Zod validation schemas and domain types used by the backend (at runtime)
 * and the frontend (type-only imports are erased at compile time).
 */
import { z } from 'zod';

/* ------------------------------------------------------------------ */
/*  Brand / currency                                                  */
/* ------------------------------------------------------------------ */

export const BRAND = {
  name: 'OOFY',
  tagline: 'Wear Your Confidence',
  location: 'Dhaka, Bangladesh',
  currencyCode: 'BDT',
  currencySymbol: '৳',
} as const;

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;

export const PAYMENT_METHODS = ['COD', 'BKASH', 'NAGAD'] as const;

export const DELIVERY_ZONES = ['INSIDE_DHAKA', 'OUTSIDE_DHAKA'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type DeliveryZone = (typeof DELIVERY_ZONES)[number];

export function formatMoney(amount: number | string | null | undefined): string {
  if (amount == null) return `${BRAND.currencySymbol}0`;
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return `${BRAND.currencySymbol}0`;
  return `${BRAND.currencySymbol}${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ------------------------------------------------------------------ */
/*  Zod schemas                                                       */
/* ------------------------------------------------------------------ */

export const AdminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const CategoryBaseSchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters.').max(100),
  slug: z
    .string()
    .min(2, 'Slug is required.')
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase, alphanumeric, and use hyphens.',
    ),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const CategoryCreateSchema = CategoryBaseSchema;
export const CategoryUpdateSchema = CategoryBaseSchema.partial();

export const ProductSizeInputSchema = z.object({
  size: z.string().min(1, 'Size is required.').max(20),
  stock: z.coerce.number().int().nonnegative('Stock cannot be negative.'),
  sku: z.string().optional().nullable(),
});

export const ProductBaseSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters.').max(200),
  slug: z
    .string()
    .min(2, 'Slug is required.')
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase, alphanumeric, and use hyphens.',
    ),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive('Price must be a positive number.'),
  discountPrice: z
    .coerce.number()
    .nonnegative()
    .optional()
    .nullable(),
  sku: z.string().min(2, 'SKU is required.').max(100),
  categoryId: z.string().uuid().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sizes: z
    .array(ProductSizeInputSchema)
    .min(1, 'At least one size variant is required.')
    .max(50),
});

export const ProductCreateSchema = ProductBaseSchema;
export const ProductUpdateSchema = ProductBaseSchema.partial().refine(
  (data) => {
    if (data.discountPrice != null && data.price != null) {
      return Number(data.discountPrice) <= Number(data.price);
    }
    return true;
  },
  {
    message: 'Discount price cannot be higher than the regular price.',
    path: ['discountPrice'],
  },
);

export const OrderCreateSchema = z.object({
  idempotencyKey: z.string().min(1).optional(),
  customerName: z.string().min(2, 'Full name is required.').max(100),
  customerPhone: z
    .string()
    .min(5, 'Please enter a valid mobile number.')
    .max(20),
  customerEmail: z.string().email().optional().nullable(),
  address: z.string().min(5, 'Please enter your full delivery address.').max(500),
  district: z.string().min(2, 'District is required.').max(100),
  zone: z.enum(DELIVERY_ZONES),
  paymentMethod: z.enum(PAYMENT_METHODS),
  orderNote: z.string().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Invalid product.'),
        size: z.string().min(1, 'Please select a size.').max(20),
        quantity: z.coerce.number().int().positive().max(10),
      }),
    )
    .min(1, 'Your cart must contain at least one item.'),
});

export const OrderTrackSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required.'),
  customerPhone: z.string().min(1, 'Phone number is required.'),
});

export const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().email('Please enter a valid email address.'),
  message: z.string().min(5, 'Message is too short.').max(2000),
});

export const StoreSettingsSchema = z.object({
  deliveryFeeDhaka: z.coerce.number().nonnegative().optional(),
  deliveryFeeOutsideDhaka: z.coerce.number().nonnegative().optional(),
  companyName: z.string().optional(),
  companyEmail: z.string().email().optional(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  whatsappNumber: z.string().optional(),
  facebookUrl: z.string().url().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  tiktokUrl: z.string().url().optional().nullable(),
  announcementText: z.string().optional(),
  returnPolicy: z.string().optional().nullable(),
  bkashEnabled: z.boolean().optional(),
  nagadEnabled: z.boolean().optional(),
  codEnabled: z.boolean().optional(),
});

/* ------------------------------------------------------------------ */
/*  Domain types                                                      */
/* ------------------------------------------------------------------ */

export interface SharedProduct {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  sku: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isActive: boolean;
}

export interface SharedCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
}

export interface SharedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: Date;
}
