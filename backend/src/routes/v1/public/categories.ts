import { Router } from 'express';
import { prisma } from '../../../lib/prisma';
import { validateQuery } from '../../../middleware/validate';
import { asyncHandler, NotFoundError } from '../../../middleware/error';
import { z } from 'zod';
import { listProducts } from './products';

const router = Router();

const CategoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

router.get('/', asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, slug: true, description: true, imageUrl: true, isActive: true, sortOrder: true },
  });
  res.json({ success: true, data: categories });
}));

router.get('/:slug/products', validateQuery(CategoryQuerySchema), asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: String(req.params.slug) },
    select: { id: true, name: true, slug: true, isActive: true },
  });
  if (!category) throw new NotFoundError('Category not found');

  const result = await listProducts({
    ...(req.query as any),
    category: category.slug,
  });
  res.json({ success: true, category, ...result });
}));

export { router as categoriesRouter };
