import { Router } from "express";
import { prisma } from "../../../lib/prisma";
import { publicOrder, toNumber } from "../../../lib/helpers";
import { env } from "../../../lib/env";
import { trackLimiter } from "../../../middleware/rateLimiter";
import { validateBody } from "../../../middleware/validate";
import { asyncHandler, NotFoundError, UnauthorizedError } from "../../../middleware/error";
import { OrderTrackSchema } from "@oofy/shared";
import { Request, Response } from "express";

const router = Router();

router.post(
  "/",
  trackLimiter,
  validateBody(OrderTrackSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber, customerPhone } = req.body as {
      orderNumber: string;
      customerPhone: string;
    };

    const order = await prisma.order.findFirst({
      where: { orderNumber, customerPhone },
      select: {
        trackingToken: true,
        orderNumber: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    if (!order) {
      throw new UnauthorizedError("Invalid order number or phone number.");
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        trackingToken: order.trackingToken,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        orderDate: order.createdAt,
        trackingUrl: env.FRONTEND_URL + "/track-order?token=" + order.trackingToken,
      },
    });
  }),
);

router.get(
  "/:token",
  asyncHandler(async (req: Request, res: Response) => {
    const order = await prisma.order.findUnique({
      where: { trackingToken: String(req.params.token) },
      select: {
        orderNumber: true,
        trackingToken: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        address: true,
        district: true,
        zone: true,
        deliveryCharge: true,
        subtotal: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        orderStatus: true,
        orderNote: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: { productName: true, productSku: true, size: true, quantity: true, price: true },
        },
        statusHistory: {
          select: { status: true, note: true, changedBy: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) throw new NotFoundError("Order tracking record not found.");

    const items = (order as any).items ?? [];

    res.json({
      success: true,
      data: {
        ...publicOrder(order),
        items: items.map((i: any) => ({
          ...i,
          price: toNumber(i.price),
        })),
        deliveryCharge: toNumber(order.deliveryCharge),
        subtotal: toNumber(order.subtotal),
        totalAmount: toNumber(order.totalAmount),
      },
    });
  }),
);

export { router as trackRouter };
