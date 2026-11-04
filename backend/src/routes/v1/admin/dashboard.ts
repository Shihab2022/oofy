import { Router } from 'express';
import { prisma } from '../../../lib/prisma';
import { authenticateAdmin } from '../../../middleware/auth';
import { asyncHandler } from '../../../middleware/error';
import { toNumber } from '../../../lib/helpers';

const router = Router();

router.get(
  '/stats',
  authenticateAdmin,
  asyncHandler(async (_req, res) => {
    const [
      totalOrders,
      revenueResult,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      lowStockCount,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.count({ where: { orderStatus: 'PROCESSING' } }),
      prisma.order.count({ where: { orderStatus: 'DELIVERED' } }),
      prisma.order.count({ where: { orderStatus: 'CANCELLED' } }),
      prisma.productSize.count({ where: { stock: { lte: 5 } } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { items: { select: { productName: true, quantity: true } } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: toNumber(revenueResult._sum.totalAmount),
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        lowStockProducts: lowStockCount,
        recentOrders: recentOrders.map((o) => ({
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          totalAmount: toNumber(o.totalAmount),
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
          items: o.items.map((i) => ({ productName: i.productName, quantity: i.quantity })),
        })),
      },
    });
  }),
);

router.get(
  '/recent-orders',
  authenticateAdmin,
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { items: { select: { productName: true, quantity: true, size: true } } },
    });
    res.json({
      success: true,
      data: orders.map((o) => ({
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        totalAmount: toNumber(o.totalAmount),
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({ productName: i.productName, quantity: i.quantity, size: i.size })),
      })),
    });
  }),
);

export { router as dashboardRouter };
