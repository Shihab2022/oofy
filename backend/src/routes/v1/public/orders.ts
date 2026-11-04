import { Router } from 'express';
import crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../../lib/prisma';
import { generateOrderNumber, getSettings, publicOrder } from '../../../lib/helpers';
import { sendMail } from '../../../lib/mail';
import { orderAdminEmailHtml, orderCustomerEmailHtml } from '../../../lib/email-templates';
import { env } from '../../../lib/env';
import { orderLimiter } from '../../../middleware/rateLimiter';
import { validateBody } from '../../../middleware/validate';
import { asyncHandler, BadRequestError, NotFoundError } from '../../../middleware/error';
import { OrderCreateSchema } from '@oofy/shared';

const router = Router();

router.post(
  '/',
  orderLimiter,
  validateBody(OrderCreateSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as typeof OrderCreateSchema._type;
    const idempotencyKey = data.idempotencyKey ?? null;

    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({ where: { idempotencyKey } });
      if (existing) {
        return res.json({ success: true, data: { order: publicOrder(existing), replayed: true } });
      }
    }

    const settings = await getSettings();
    const deliveryFeeDhaka = new Decimal(settings.deliveryFeeDhaka ?? env.DELIVERY_FEE_DHAKA);
    const deliveryFeeOutside = new Decimal(
      settings.deliveryFeeOutsideDhaka ?? env.DELIVERY_FEE_OUTSIDE_DHAKA,
    );

    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { sizes: true },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundError('One or more products are no longer available.');
    }

    let subtotal = new Decimal(0);
    const validatedItems: Array<{
      product: any;
      size: any;
      unitPrice: Decimal;
      quantity: number;
    }> = [];

    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new NotFoundError(`Product not found: ${item.productId}`);

      const size = product.sizes.find((s) => s.size === item.size);
      if (!size) {
        throw new BadRequestError(`Size "${item.size}" is not available for ${product.name}.`);
      }

      const unitPrice = product.discountPrice
        ? new Decimal(product.discountPrice)
        : new Decimal(product.price);
      subtotal = subtotal.add(unitPrice.mul(item.quantity));
      validatedItems.push({ product, size, unitPrice, quantity: item.quantity });
    }

    const deliveryCharge =
      data.zone === 'INSIDE_DHAKA' ? deliveryFeeDhaka : deliveryFeeOutside;
    const totalAmount = subtotal.add(deliveryCharge);

    const orderNumber = await generateOrderNumber({
      findExisting: (n) =>
        prisma.order.findUnique({ where: { orderNumber: n }, select: { orderNumber: true } }),
    });
    const trackingToken = crypto.randomBytes(32).toString('hex');

    const order = await prisma.$transaction(
      async (tx) => {
        // Decrement stock safely: only when sufficient stock exists (UPDATE takes a row lock).
        for (const vi of validatedItems) {
          const updated = await tx.$queryRawUnsafe(
            'UPDATE "product_sizes" SET stock = stock - $1 WHERE "id" = $2 AND "stock" >= $3 RETURNING id',
            [vi.quantity, vi.size.id, vi.quantity],
          );
          if (!Array.isArray(updated) || updated.length === 0) {
            throw new BadRequestError(
              `Insufficient stock for ${vi.product.name} (size ${vi.size.size}).`,
            );
          }
        }

        return tx.order.create({
          data: {
            orderNumber,
            trackingToken,
            idempotencyKey,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail ?? null,
            address: data.address,
            district: data.district,
            zone: data.zone,
            deliveryCharge: deliveryCharge.toString(),
            subtotal: subtotal.toString(),
            totalAmount: totalAmount.toString(),
            paymentMethod: data.paymentMethod,
            paymentStatus: 'PENDING',
            orderStatus: 'PENDING',
            orderNote: data.orderNote ?? null,
            items: {
              create: validatedItems.map((vi) => ({
                productId: vi.product.id,
                productName: vi.product.name,
                productSku: vi.product.sku,
                size: vi.size.size,
                quantity: vi.quantity,
                price: vi.unitPrice.toString(),
              })),
            },
            statusHistory: {
              create: {
                status: 'PENDING',
                changedBy: 'system',
                note: 'Order placed by customer',
              },
            },
          },
          include: { items: true, statusHistory: true },
        });
      },
      { isolationLevel: 'Serializable', maxWait: 5000, timeout: 15000 },
    );

    // Email failures must never roll back a successfully created order.
    const adminHtml = orderAdminEmailHtml(order, order.items);
    const customerHtml = order.customerEmail
      ? orderCustomerEmailHtml(order, order.items)
      : null;
    await Promise.all([
      sendMail({
        to: env.COMPANY_EMAIL,
        subject: `New OOFY Order #${order.orderNumber}`,
        html: adminHtml,
        type: 'ORDER_ADMIN',
      }),
      customerHtml
        ? sendMail({
            to: order.customerEmail!,
            subject: `Your OOFY Order #${order.orderNumber} is confirmed`,
            html: customerHtml,
            type: 'ORDER_CUSTOMER',
          })
        : Promise.resolve(),
    ]).catch((err) => console.error('[mail] Email dispatch error:', err));

    res.status(201).json({
      success: true,
      data: {
        order: publicOrder(order),
        trackingUrl: `${env.FRONTEND_URL}/track-order?token=${order.trackingToken}`,
      },
    });
  }),
);

export { router as ordersRouter };
