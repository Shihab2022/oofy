import { z } from 'zod';

const imageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  alt: z.string().optional(),
  position: z.number().int().nonnegative().optional(),
});

const variantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  color: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  stock: z.number().int().nonnegative('Stock must be non-negative'),
  price: z.string().optional().nullable(),
});

export const productCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    slug: z.string().min(2, 'Slug is required'),
    description: z.string().optional(),
    basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid base price'),
    discountPrice: z.string().optional().nullable(),
    categoryId: z.string().uuid('Invalid category'),
    isFeatured: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    images: z.array(imageSchema).optional(),
    variants: z.array(variantSchema).optional(),
  }),
});

export const productUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid product id') }),
  body: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    description: z.string().optional(),
    basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid base price').optional(),
    discountPrice: z.string().optional().nullable(),
    categoryId: z.string().uuid('Invalid category').optional(),
    isFeatured: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    images: z.array(imageSchema).optional(),
    variants: z.array(variantSchema).optional(),
  }),
});