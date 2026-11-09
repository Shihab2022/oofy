import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const getCategories = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: { where: { isPublished: true } } } } },
    });
    res.json({ success: true, data: categories });
  }
);

export const getAllCategoriesAdmin = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json({ success: true, data: categories });
  }
);

export const createCategory = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { name, slug, description, isActive } = req.body;
    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) {
      throw new ApiError(409, 'Category slug already exists');
    }
    const category = await db.category.create({
      data: { name, slug, description, isActive: isActive !== false },
    });
    res.status(201).json({ success: true, data: category });
  }
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const exists = await db.category.findUnique({ where: { id } });
    if (!exists) {
      throw new ApiError(404, 'Category not found');
    }
    const { name, slug, description, isActive } = req.body;
    const category = await db.category.update({
      where: { id },
      data: { ...(name !== undefined ? { name } : {}), ...(slug !== undefined ? { slug } : {}), ...(description !== undefined ? { description } : {}), ...(isActive !== undefined ? { isActive } : {}) },
    });
    res.json({ success: true, data: category });
  }
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const exists = await db.category.findUnique({ where: { id } });
    if (!exists) {
      throw new ApiError(404, 'Category not found');
    }
    await db.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted' });
  }
);