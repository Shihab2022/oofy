import { Router } from 'express';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../../lib/prisma';
import { authenticateAdmin } from '../../../middleware/auth';
import { validateBody } from '../../../middleware/validate';
import { asyncHandler, NotFoundError, BadRequestError } from '../../../middleware/error';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@oofy/shared';
import { toNumber } from '../../../lib/helpers';

const router = Router();
const IdSchema = z.object({ id: z.string().uuid() });

const OrderListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

function mapAdminOrder(o: any) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: o.customerEmail,
    address: o.address,
    district: o.district,
    zone: o.zone,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    subtotal: toNumber(o.subtotal),
    deliveryCharge: toNumber(o.deliveryCharge),
    totalAmount: toNumber(o.totalAmount),
    orderNote: o.orderNote,
    itemCount: o.items?.length ?? 0,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

/* ------------------------------------------------------------------ */
/*  List                                                              */
/* ------------------------------------------------------------------ */

router.get(
  '/',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, search, status, paymentStatus, from, to } = OrderListQuery.parse(
      req.query,
    );

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
      ];
    }
    if (status) where.orderStatus = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * take;

    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { items: { select: { id: true, productName: true, quantity: true } } },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: items.map(mapAdminOrder),
      meta: { total, page, limit: take, totalPages: Math.ceil(total / take) },
    });
  }),
);

/* ------------------------------------------------------------------ */
/*  Update order status                                               */
/* ------------------------------------------------------------------ */

router.patch(
  '/:id/status',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const { id } = IdSchema.parse(req.params);
    const { status, note } = req.body as { status?: string; note?: string };

    if (!status || !ORDER_STATUSES.includes(status as any)) {
      throw new BadRequestError(`Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}`);
    }

    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundError('Order not found');
    if (order.orderStatus === 'DELIVERED') {
      throw new BadRequestError('Cannot change status of a delivered order.');
    }
    if (order.orderStatus === 'CANCELLED' && status !== 'CANCELLED') {
      throw new BadRequestError('A cancelled order cannot be moved to another status.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id } });
      if (!current) throw new NotFoundError('Order not found');

      const nextOrder = await tx.order.update({
        where: { id },
        data: { orderStatus: status },
        include: { items: true },
      });

      // Restore stock when an order is cancelled (unless already cancelled/delivered).
      if (
        status === 'CANCELLED' &&
        current.orderStatus !== 'CANCELLED' &&
        current.orderStatus !== 'DELIVERED'
      ) {
        for (const item of (current as any).items) {
          await tx.productSize.updateMany({
            where: { productId: item.productId, size: item.size },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
          note: note ?? `Status changed to ${status}`,
          changedBy: (req as any).admin?.id ?? 'system',
        },
      });

      return nextOrder;
    });

    res.json({ success: true, data: mapAdminOrder(updated) });
  }),
);

/* ------------------------------------------------------------------ */
/*  Update payment status                                             */
/* ------------------------------------------------------------------ */

router.patch(
  '/:id/payment-status',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const { id } = IdSchema.parse(req.params);
    const { paymentStatus } = req.body as { paymentStatus?: string };

    if (!paymentStatus || !PAYMENT_STATUSES.includes(paymentStatus as any)) {
      throw new BadRequestError(`Invalid payment status. Allowed: ${PAYMENT_STATUSES.join(', ')}`);
    }

    await prisma.order.update({
      where: { id },
      data: { paymentStatus },
    });

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, orderNumber: true, paymentStatus: true, orderStatus: true },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: order!.orderStatus,
        note: `Payment status changed to ${paymentStatus}`,
        changedBy: (req as any).admin?.id ?? 'system',
      },
    });

    res.json({ success: true, data: order });
  }),
);

/* ------------------------------------------------------------------ */
/*  Internal note                                                     */
/* ------------------------------------------------------------------ */

router.post(
  '/:id/notes',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const { id } = IdSchema.parse(req.params);
    const { note } = req.body as { note?: string };
    if (!note || note.trim().length === 0) throw new BadRequestError('Note is required');

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError('Order not found');

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: order.orderStatus,
        note: note.trim(),
        changedBy: (req as any).admin?.id ?? 'system',
      },
    });

    res.json({ success: true, message: 'Note added' });
  }),
);

export { router as adminOrdersRouter };
