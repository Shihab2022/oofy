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
  let isScheduled = false;
  let scheduledAt: string | null = null;
  const match = (p.careInstructions || '').match(/\[SCHEDULED:([^\]]+)\]/);
  if (match) {
    scheduledAt = match[1];
    const targetTime = new Date(scheduledAt).getTime();
    if (!isNaN(targetTime)) {
      isScheduled = Date.now() < targetTime;
    }
  }

  const isLive = p.isPublished || (scheduledAt ? Date.now() >= new Date(scheduledAt).getTime() : false);

  return {
    ...p,
    isFreeDelivery: Boolean(
      p.careInstructions?.includes('[FREE_DELIVERY]') ||
      p.description?.includes('[FREE_DELIVERY]') ||
      p.shortDescription?.includes('[FREE_DELIVERY]')
    ),
    isScheduled,
    scheduledAt,
    isCurrentlyLive: isLive,
  };
}

export async function syncScheduledProducts() {
  try {
    const scheduledCandidates = await db.product.findMany({
      where: {
        isPublished: false,
        careInstructions: { contains: '[SCHEDULED:' },
      },
      select: { id: true, careInstructions: true },
    });

    const now = Date.now();
    for (const cand of scheduledCandidates) {
      const match = (cand.careInstructions || '').match(/\[SCHEDULED:([^\]]+)\]/);
      if (match) {
        const target = new Date(match[1]).getTime();
        if (!isNaN(target) && now >= target) {
          await db.product.update({
            where: { id: cand.id },
            data: { isPublished: true },
          });
        }
      }
    }
  } catch (_err) {
    // Non-blocking sync
  }
}

export const getProducts = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    await syncScheduledProducts();
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
      scheduledAt,
      publishNow,
      images = [],
      variants = [],
    } = req.body;

    let finalCare = careInstructions || '';
    if (isFreeDelivery !== undefined) {
      const baseCare = finalCare.replace(/\[FREE_DELIVERY\]/g, '').trim();
      finalCare = isFreeDelivery ? (baseCare ? `[FREE_DELIVERY] ${baseCare}` : '[FREE_DELIVERY]') : baseCare;
    }

    let finalPublished = isPublished !== false;
    if (scheduledAt) {
      finalCare = finalCare.replace(/\[SCHEDULED:[^\]]+\]/g, '').trim();
      finalCare = `${finalCare} [SCHEDULED:${scheduledAt}]`.trim();
      const target = new Date(scheduledAt).getTime();
      if (!isNaN(target) && target > Date.now()) {
        finalPublished = false;
      }
    } else if (publishNow) {
      finalCare = finalCare.replace(/\[SCHEDULED:[^\]]+\]/g, '').trim();
      finalPublished = true;
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
        isPublished: finalPublished,
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
      scheduledAt,
      publishNow,
      images,
      variants,
    } = req.body;

    let finalCare = careInstructions;
    const existingCare = exists.careInstructions || '';
    let currentCare = careInstructions !== undefined ? (careInstructions || '') : existingCare;

    if (isFreeDelivery !== undefined) {
      const baseCare = currentCare.replace(/\[FREE_DELIVERY\]/g, '').trim();
      currentCare = isFreeDelivery ? (baseCare ? `[FREE_DELIVERY] ${baseCare}` : '[FREE_DELIVERY]') : baseCare;
      finalCare = currentCare;
    }

    let finalPublished = isPublished;
    if (isPublished === false) {
      currentCare = currentCare.replace(/\[SCHEDULED:[^\]]+\]/g, '').trim();
      finalCare = currentCare;
      finalPublished = false;
    } else if (scheduledAt) {
      currentCare = currentCare.replace(/\[SCHEDULED:[^\]]+\]/g, '').trim();
      currentCare = `${currentCare} [SCHEDULED:${scheduledAt}]`.trim();
      finalCare = currentCare;
      const target = new Date(scheduledAt).getTime();
      if (!isNaN(target) && target > Date.now()) {
        finalPublished = false;
      }
    } else if (publishNow) {
      currentCare = currentCare.replace(/\[SCHEDULED:[^\]]+\]/g, '').trim();
      finalCare = currentCare;
      finalPublished = true;
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
        ...(finalPublished !== undefined ? { isPublished: finalPublished } : {}),
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
    await syncScheduledProducts();
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
    const { discountPercent, clearAll, productIds, discountPrice } = req.body;

    const hasSpecificIds = Array.isArray(productIds) && productIds.length > 0;

    if (clearAll) {
      if (hasSpecificIds) {
        await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { discountPrice: null },
        });
        res.json({ success: true, message: `Discounts removed from ${productIds.length} selected products.` });
      } else {
        await db.product.updateMany({
          data: { discountPrice: null },
        });
        res.json({ success: true, message: 'All discounts removed from all products.' });
      }
      return;
    }

    if (discountPrice !== undefined && discountPrice !== null && discountPrice !== '') {
      const fixed = Math.max(0, Number(discountPrice));
      if (hasSpecificIds) {
        await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { discountPrice: fixed },
        });
        res.json({ success: true, message: `Set discount price ৳${fixed} for ${productIds.length} selected products.` });
      } else {
        await db.product.updateMany({
          data: { discountPrice: fixed },
        });
        res.json({ success: true, message: `Set discount price ৳${fixed} for all products.` });
      }
      return;
    }

    const pct = Number(discountPercent);
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      throw new ApiError(400, 'Discount percentage must be between 1% and 99%');
    }

    const targetProducts = await db.product.findMany({
      where: hasSpecificIds ? { id: { in: productIds } } : {},
      select: { id: true, basePrice: true },
    });

    for (const prod of targetProducts) {
      const discounted = Math.round(Number(prod.basePrice) * (1 - pct / 100));
      await db.product.update({
        where: { id: prod.id },
        data: { discountPrice: discounted },
      });
    }

    res.json({
      success: true,
      message: hasSpecificIds
        ? `Applied ${pct}% discount to ${targetProducts.length} selected products.`
        : `Applied ${pct}% discount to all ${targetProducts.length} products.`,
    });
  }
);

export const bulkFreeDeliveryProducts = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { enableAll, clearAll, productIds, enable } = req.body;

    const hasSpecificIds = Array.isArray(productIds) && productIds.length > 0;
    const shouldEnable = enableAll === true || enable === true;

    const targetProducts = await db.product.findMany({
      where: hasSpecificIds ? { id: { in: productIds } } : {},
      select: { id: true, careInstructions: true },
    });

    for (const prod of targetProducts) {
      const current = prod.careInstructions || '';
      let updated = current;
      if (clearAll || (!shouldEnable && hasSpecificIds)) {
        updated = current.replace(/\[FREE_DELIVERY\]/g, '').trim();
      } else if (shouldEnable) {
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
      message: shouldEnable
        ? hasSpecificIds
          ? `Free delivery enabled for ${targetProducts.length} selected products.`
          : 'Free delivery enabled for all products.'
        : hasSpecificIds
          ? `Free delivery removed from ${targetProducts.length} selected products.`
          : 'Free delivery disabled on all products.',
    });
  }
);

export const toggleFeaturedProduct = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id, isFeatured } = req.body;
    if (!id) throw new ApiError(400, 'Product ID is required');

    const product = await db.product.update({
      where: { id },
      data: { isFeatured: Boolean(isFeatured) },
    });

    res.json({
      success: true,
      message: product.isFeatured ? 'Product pinned to Home spotlight.' : 'Product unpinned from Home spotlight.',
      data: formatProduct(product),
    });
  }
);

export const toggleProductStatus = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id, isPublished } = req.body;
    if (!id) throw new ApiError(400, 'Product ID is required');

    const product = await db.product.update({
      where: { id },
      data: { isPublished: Boolean(isPublished) },
    });

    res.json({
      success: true,
      message: product.isPublished
        ? 'Product is now live and showing on the website.'
        : 'Product is now hidden (turned off) from the website.',
      data: formatProduct(product),
    });
  }
);
