import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

function toDecimal(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatProduct(p: any) {
  if (!p) return p;
  return {
    ...p,
    isFreeDelivery: Boolean(
      p.careInstructions?.includes('[FREE_DELIVERY]') ||
      p.description?.includes('[FREE_DELIVERY]') ||
      p.shortDescription?.includes('[FREE_DELIVERY]')
    ),
  };
}

export const getProducts = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      size,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const where: any = { isPublished: true };

    if (category) where.category = { slug: category };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = toDecimal(minPrice) ?? 0;
      if (maxPrice !== undefined) where.basePrice.lte = toDecimal(maxPrice) ?? Number.MAX_SAFE_INTEGER;
    }
    if (size) {
      where.variants = { some: { size, stock: { gt: 0 } } };
    }

    const take = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { basePrice: 'asc' };
    if (sort === 'price-desc') orderBy = { basePrice: 'desc' };
    if (sort === 'popularity') orderBy = { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        take,
        skip,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { position: 'asc' } },
          variants: { orderBy: { size: 'asc' } },
        },
      }),
      db.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        products: products.map(formatProduct),
        pagination: { total, page: Number(page), limit: take, totalPages: Math.ceil(total / take) },
      },
    });
  }
);

export const getProductBySlug = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { slug } = req.params as { slug: string };
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { size: 'asc' } },
      },
    });

    if (!product || !product.isPublished) {
      throw new ApiError(404, 'Product not found');
    }

    const related = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isPublished: true,
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { size: 'asc' } },
      },
    });

    res.json({ success: true, data: { product: formatProduct(product), related: related.map(formatProduct) } });
  }
);

export const getFeaturedProducts = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const products = await db.product.findMany({
      where: { isPublished: true, isFeatured: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { size: 'asc' } },
      },
    });
    res.json({ success: true, data: products.map(formatProduct) });
  }
);

export const getNewArrivals = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const products = await db.product.findMany({
      where: { isPublished: true, isNewArrival: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { size: 'asc' } },
      },
    });
    res.json({ success: true, data: products.map(formatProduct) });
  }
);
export const createProduct = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const {
      name,
      slug,
      description,
      shortDescription,
      material,
      fit,
      careInstructions,
      countryOfOrigin,
      basePrice,
      discountPrice,
      categoryId,
      isFeatured,
      isNewArrival,
      isPublished,
      isFreeDelivery,
      images = [],
      variants = [],
    } = req.body;

    let finalCare = careInstructions || '';
    if (isFreeDelivery !== undefined) {
      const baseCare = finalCare.replace(/\[FREE_DELIVERY\]/g, '').trim();
      finalCare = isFreeDelivery ? (baseCare ? `[FREE_DELIVERY] ${baseCare}` : '[FREE_DELIVERY]') : baseCare;
    }

    const existing = await db.product.findUnique({ where: { slug } });
    if (existing) {
      throw new ApiError(409, 'A product with this slug already exists');
    }

    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new ApiError(400, 'Choose a valid category from the category list');

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        shortDescription: shortDescription || null,
        material: material || null,
        fit: fit || null,
        careInstructions: finalCare || null,
        countryOfOrigin: countryOfOrigin || null,
        basePrice: Number(basePrice),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        categoryId,
        isFeatured: isFeatured === true,
        isNewArrival: isNewArrival === true,
        isPublished: isPublished !== false,
        images: {
          create: images.map((img: any, i: number) => ({
            url: img.url,
            alt: img.alt || name,
            position: img.position ?? i,
          })),
        },
        variants: {
          create: variants.map((v: any) => ({
            size: v.size,
            color: v.color || null,
            sku: v.sku || null,
            stock: Number(v.stock) || 0,
            price: v.price ? Number(v.price) : null,
          })),
        },
      },
      include: { images: true, variants: true },
    });

    res.status(201).json({ success: true, data: formatProduct(product) });
  }
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const exists = await db.product.findUnique({ where: { id } });
    if (!exists) {
      throw new ApiError(404, 'Product not found');
    }

    const {
      name,
      slug,
      description,
      shortDescription,
      material,
      fit,
      careInstructions,
      countryOfOrigin,
      basePrice,
      discountPrice,
      categoryId,
      isFeatured,
      isNewArrival,
      isPublished,
      isFreeDelivery,
      images,
      variants,
    } = req.body;

    let finalCare = careInstructions;
    if (isFreeDelivery !== undefined) {
      const existingCare = exists.careInstructions || '';
      const baseCare = (careInstructions !== undefined ? (careInstructions || '') : existingCare).replace(/\[FREE_DELIVERY\]/g, '').trim();
      finalCare = isFreeDelivery ? (baseCare ? `[FREE_DELIVERY] ${baseCare}` : '[FREE_DELIVERY]') : baseCare;
    }

    if (slug && slug !== exists.slug) {
      const dup = await db.product.findUnique({ where: { slug } });
      if (dup) {
        throw new ApiError(409, 'A product with this slug already exists');
      }
    }

    if (categoryId) {
      const category = await db.category.findUnique({ where: { id: categoryId } });
      if (!category) throw new ApiError(400, 'Choose a valid category from the category list');
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(shortDescription !== undefined ? { shortDescription: shortDescription || null } : {}),
        ...(material !== undefined ? { material: material || null } : {}),
        ...(fit !== undefined ? { fit: fit || null } : {}),
        ...(finalCare !== undefined ? { careInstructions: finalCare || null } : {}),
        ...(countryOfOrigin !== undefined ? { countryOfOrigin: countryOfOrigin || null } : {}),
        ...(basePrice !== undefined ? { basePrice: Number(basePrice) } : {}),
        ...(discountPrice !== undefined ? { discountPrice: discountPrice ? Number(discountPrice) : null } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(isFeatured !== undefined ? { isFeatured } : {}),
        ...(isNewArrival !== undefined ? { isNewArrival } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
        ...(images !== undefined ? {
          images: { deleteMany: {}, create: images.map((img: any, i: number) => ({ url: img.url, alt: img.alt || name || exists.name, position: img.position ?? i })) }
        } : {}),
        ...(variants !== undefined ? {
          variants: { deleteMany: {}, create: variants.map((v: any) => ({ size: v.size, color: v.color || null, sku: v.sku || null, stock: Number(v.stock) || 0, price: v.price ? Number(v.price) : null })) }
        } : {}),
      },
      include: { images: true, variants: true },
    });

    res.json({ success: true, data: formatProduct(product) });
  }
);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const exists = await db.product.findUnique({ where: { id } });
    if (!exists) {
      throw new ApiError(404, 'Product not found');
    }
    await db.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted' });
  }
);

export const getAllProductsAdmin = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const products = await db.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { size: 'asc' } },
      },
    });
    res.json({ success: true, data: products.map(formatProduct) });
  }
);

export const bulkDiscountProducts = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { discountPercent, clearAll } = req.body;

    if (clearAll) {
      await db.product.updateMany({
        data: {
          discountPrice: null,
        },
      });
      res.json({ success: true, message: 'All discounts removed from all products.' });
      return;
    }

    const pct = Number(discountPercent);
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      throw new ApiError(400, 'Discount percentage must be between 1 and 99');
    }

    const allProducts = await db.product.findMany({ select: { id: true, basePrice: true } });
    for (const prod of allProducts) {
      const discounted = Math.round(Number(prod.basePrice) * (1 - pct / 100));
      await db.product.update({
        where: { id: prod.id },
        data: { discountPrice: discounted },
      });
    }

    res.json({ success: true, message: `Applied ${pct}% discount to all ${allProducts.length} products.` });
  }
);

export const bulkFreeDeliveryProducts = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { enableAll, clearAll } = req.body;

    const allProducts = await db.product.findMany({ select: { id: true, careInstructions: true } });
    for (const prod of allProducts) {
      const current = prod.careInstructions || '';
      let updated = current;
      if (clearAll) {
        updated = current.replace(/\[FREE_DELIVERY\]/g, '').trim();
      } else if (enableAll) {
        if (!current.includes('[FREE_DELIVERY]')) {
          updated = current ? `[FREE_DELIVERY] ${current}` : '[FREE_DELIVERY]';
        }
      }
      if (updated !== current) {
        await db.product.update({
          where: { id: prod.id },
          data: { careInstructions: updated || null },
        });
      }
    }

    res.json({
      success: true,
      message: clearAll
        ? 'Free delivery disabled on all products.'
        : 'Free delivery enabled on all products.',
    });
  }
);
