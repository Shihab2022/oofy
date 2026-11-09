import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';

export const getDashboardStats = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const [totalOrders, totalProducts, pendingOrders, completedOrders, sales, recentOrders] =
      await Promise.all([
        db.order.count(),
        db.product.count(),
        db.order.count({ where: { status: 'PENDING' } }),
        db.order.count({ where: { status: 'DELIVERED' } }),
        db.order.aggregate({
          _sum: { totalAmount: true },
          _count: true,
        }),
        db.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        }),
      ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalProducts,
        pendingOrders,
        completedOrders,
        totalSales: sales._sum.totalAmount ?? 0,
        recentOrders,
      },
    });
  }
);