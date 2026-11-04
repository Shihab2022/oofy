import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { authenticateAdmin } from '../../../middleware/auth';
import { upload } from '../../../middleware/upload';
import { validateBody } from '../../../middleware/validate';
import { asyncHandler, NotFoundError, BadRequestError } from '../../../middleware/error';
import { validateImage, uploadImage, deleteImage } from '../../../lib/upload';
import { ProductCreateSchema, ProductUpdateSchema } from '@oofy/shared';

const router = Router();

const IdSchema = z.object({ id: z.string().uuid() });
const ImageIdSchema = z.object({ imageId: z.string().uuid() });

function toDecimalString(value: number | string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

function mapAdminProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    discountPrice: p.discountPrice,
    sku: p.sku,
    categoryId: p.categoryId,
    category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    sizes: (p.sizes ?? []).map((s: any) => ({ id: s.id, size: s.size, stock: s.stock, sku: s.sku })),
    images: (p.images ?? []).map((img: any) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
      cloudinaryId: img.cloudinaryId,
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  List                                                              */
/* ------------------------------------------------------------------ */

router.get(
  '/',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const { search, isActive, isFeatured, isNewArrival, category, page, limit } = req.query as any;
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';
    if (isNewArrival !== undefined) where.isNewArrival = isNewArrival === 'true';
    if (category) where.categoryId = category;

    const take = Math.min(Math.max(parseInt(limit ?? '20', 10), 1), 100);
    const skip = (Math.max(parseInt(page ?? '1', 10), 1) - 1) * take;

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          sizes: { select: { size: true, stock: true } },
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: items.map(mapAdminProduct),
      meta: {
        total,
        page: Math.max(parseInt(page ?? '1', 10), 1),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  }),
);

/* ------------------------------------------------------------------ */
/*  Detail                                                            */
/* ------------------------------------------------------------------ */

router.get(
  '/:id',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const { id } = IdSchema.parse(req.params);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        sizes: { orderBy: { size: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!product) throw new NotFoundError('Product not found');
    res.json({ success: true, data: mapAdminProduct(product) });
  }),
);

/* ------------------------------------------------------------------ */
/*  Create                                                            */
/* ------------------------------------------------------------------ */

router.post(
  '/',
  authenticateAdmin,
  validateBody(ProductCreateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as typeof ProductCreateSchema._type;
    const { sizes, ...productData } = data;

    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.slug,
        description: productData.description ?? null,
        price: toDecimalString(productData.price) ?? '0',
        discountPrice: toDecimalString(productData.discountPrice),
        sku: productData.sku,
        categoryId: productData.categoryId,
        isFeatured: productData.isFeatured,
        isNewArrival: productData.isNewArrival,
        isActive: productData.isActive,
        sizes: {
          create: sizes.map((s) => ({
            size: s.size,
            stock: s.stock,
            sku: s.sku ?? null,
          })),
        },
      },
      include: { sizes: true, images: true, category: true },
    });

    res.status(201).json({ success: true, data: mapAdminProduct(product) });
  }),
);

/* ------------------------------------------------------------------ */
/*  Update                                                            */
/* ------------------------------------------------------------------ */

router.patch(
  '/:id',
  authenticateAdmin,
  validateBody(ProductUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = IdSchema.parse(req.params);
    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundError('Product not found');

    const data = req.body as typeof ProductUpdateSchema._type;
    const { sizes, ...rest } = data;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(rest.name !== undefined ? { name: rest.name } : {}),
        ...(rest.slug !== undefined ? { slug: rest.slug } : {}),
        ...(rest.description !== undefined ? { description: rest.description } : {}),
        ...(rest.price !== undefined ? { price: toDecimalString(rest.price) } : {}),
        ...(rest.discountPrice !== undefined ? { discountPrice: toDecimalString(rest.discountPrice) } : {}),
        ...(rest.sku !== undefined ? { sku: rest.sku } : {}),
        categoryId: rest.categoryId,
        ...(rest.isFeatured !== undefined ? { isFeatured: rest.isFeatured } : {}),
        ...(rest.isNewArrival !== undefined ? { isNewArrival: rest.isNewArrival } : {}),
        ...(rest.isActive !== undefined ? { isActive: rest.isActive } : {}),
        ...(sizes
          ? {
              sizes: { deleteMany: {}, create: sizes.map((s) => ({ size: s.size, stock: s.stock, sku: s.sku ?? null })) },
            }
          : {}),
      } as any,
      include: { sizes: true, images: true, category: true },
    });

    res.json({ success: true, data: mapAdminProduct(product) });
  }),
);

/* ------------------------------------------------------------------ */
/*  Delete / Archive                                                  */
/* ------------------------------------------------------------------ */

router.delete(
  '/:id',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const { id } = IdSchema.parse(req.params);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');

    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return res.json({ success: true, data: { archived: true, message: 'Product archived (has order history)' } });
    }

    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.productSize.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, data: { deleted: true } });
  }),
);

/* ------------------------------------------------------------------ */
/*  Images                                                            */
/* ------------------------------------------------------------------ */

router.post(
  '/:id/images',
  authenticateAdmin,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const { id } = IdSchema.parse(req.params);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');
    if (!req.file) throw new BadRequestError('No image file provided');

    validateImage(req.file);
    const { secure_url, public_id } = await uploadImage(req.file.buffer, {
      folder: 'oofy/products',
    });

    const existingCount = await prisma.productImage.count({ where: { productId: id } });
    const image = await prisma.productImage.create({
      data: {
        productId: id,
        url: secure_url,
        cloudinaryId: public_id,
        isPrimary: existingCount === 0,
        sortOrder: existingCount,
      },
    });

    res.status(201).json({ success: true, data: image });
  }),
);

router.delete(
  '/:id/images/:imageId',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const { id } = IdSchema.parse(req.params);
    const { imageId } = ImageIdSchema.parse({ imageId: req.params.imageId });
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId: id },
    });
    if (!image) throw new NotFoundError('Image not found');

    if (image.cloudinaryId) {
      try {
        await deleteImage(image.cloudinaryId);
      } catch {
        // Ignore Cloudinary errors; still remove the DB record.
      }
    }

    const wasPrimary = image.isPrimary;
    await prisma.productImage.delete({ where: { id: imageId } });

    if (wasPrimary) {
      const next = await prisma.productImage.findFirst({
        where: { productId: id },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    }

    res.json({ success: true });
  }),
);

router.patch(
  '/:id/images/:imageId/primary',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const { id } = IdSchema.parse(req.params);
    const { imageId } = ImageIdSchema.parse({ imageId: req.params.imageId });
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId: id },
    });
    if (!image) throw new NotFoundError('Image not found');

    await prisma.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
    await prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });

    res.json({ success: true });
  }),
);

export { router as adminProductsRouter };
