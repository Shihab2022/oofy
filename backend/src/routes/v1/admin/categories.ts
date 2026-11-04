import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { authenticateAdmin } from '../../../middleware/auth';
import { validateBody } from '../../../middleware/validate';
import { asyncHandler, NotFoundError } from '../../../middleware/error';
import { CategoryCreateSchema, CategoryUpdateSchema } from '@oofy/shared';

const router = Router();

router.get(
  '/',
  authenticateAdmin,
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json({ success: true, data: categories });
  }),
);

router.post(
  '/',
  authenticateAdmin,
  validateBody(CategoryCreateSchema),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.create({
      data: {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description ?? null,
        isActive: req.body.isActive,
        sortOrder: req.body.sortOrder,
      },
    });
    res.status(201).json({ success: true, data: category });
  }),
);

router.patch(
  '/:id',
  authenticateAdmin,
  validateBody(CategoryUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const exists = await prisma.category.findUnique({ where: { id } });
    if (!exists) throw new NotFoundError('Category not found');

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.slug !== undefined ? { slug: req.body.slug } : {}),
        ...(req.body.description !== undefined ? { description: req.body.description } : {}),
        ...(req.body.isActive !== undefined ? { isActive: req.body.isActive } : {}),
        ...(req.body.sortOrder !== undefined ? { sortOrder: req.body.sortOrder } : {}),
      },
    });
    res.json({ success: true, data: category });
  }),
);

router.delete(
  '/:id',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      await prisma.category.update({ where: { id }, data: { isActive: false } });
      return res.json({ success: true, data: { archived: true } });
    }
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, data: { deleted: true } });
  }),
);

export { router as categoriesRouter };
