import { Router } from 'express';
import { prisma } from '../../../lib/prisma';
import { toNumber } from '../../../lib/helpers';
import { validateQuery } from '../../../middleware/validate';
import { asyncHandler, NotFoundError } from '../../../middleware/error';
import { z } from 'zod';

const router = Router();

const ProductQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function mapProduct(p: any) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: toNumber(p.price),
    discountPrice: p.discountPrice ? toNumber(p.discountPrice) : null,
    sku: p.sku,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    category: p.category
      ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
      : null,
    primaryImage: p.images?.[0] ?? null,
    imageCount: p.images?.length ?? 0,
    inStock: (p.sizes ?? []).some((s: any) => s.stock > 0),
  };
}

async function listProducts(query: any) {
  const { category, search, sort, page, limit } = query;
  const skip = (page - 1) * limit;
  const where: any = {
    isActive: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };
  const orderBy: any =
    sort === 'price_asc' ? { price: 'asc' } : sort === 'price_desc' ? { price: 'desc' } : { createdAt: 'desc' };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
        sizes: { select: { size: true, stock: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products.map(mapProduct),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

router.get('/', validateQuery(ProductQuerySchema), asyncHandler(async (req, res) => {
  const result = await listProducts(req.query as any);
  res.json({ success: true, ...result });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const product = (await prisma.product.findUnique({
    where: { slug: String(req.params.slug) },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      sizes: { select: { id: true, size: true, stock: true, sku: true }, orderBy: { size: 'asc' } },
      category: { select: { id: true, name: true, slug: true } },
    },
  })) as any;
  if (!product || !product.isActive) throw new NotFoundError('Product not found');

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isActive: true,
      id: { not: product.id },
    },
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  });

  res.json({
    success: true,
    data: {
      ...mapProduct(product),
      images: product.images.map((img: any) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary,
      })),
      sizes: product.sizes,
      category: product.category
        ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
        : null,
      related: related.map(mapProduct),
    },
  });
}));

export { router as productsRouter, listProducts };
