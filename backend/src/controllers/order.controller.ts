import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from '../services/email.service';

function generateOrderNumber(): string {
  const prefix = 'OOFY';
  const random = Math.floor(100000 + Math.random() * 900000).toString();
  return `${prefix}-${random}`;
}

export const createOrder = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const {
      customerName,
      customerPhone,
      customerEmail,
      address,
      district,
      area,
      orderNotes,
      paymentMethod = 'COD',
      items,
    } = req.body;

    const settings = await db.storeSettings.findFirst();
    if (settings && !settings.codEnabled) {
      throw new ApiError(400, 'Cash on delivery is currently unavailable');
    }
    const deliveryCharge = settings?.deliveryCharge ?? 60;

    // Validate stock and compute totals inside a transaction
    const result = await db.$transaction(async (tx) => {
      const orderItemsInput: any[] = [];
      let subtotal = 0;

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });
        if (!product || !product.isPublished) {
          throw new ApiError(400, `Product ${item.productId} not found or unpublished`);
        }

        let variant: any = null;
        let unitPrice: number = Number(product.basePrice);
        let stockField: any = null;

        if (item.variantId) {
          variant = product.variants.find((v) => v.id === item.variantId);
          if (!variant) {
            throw new ApiError(400, `Selected variant not found for product ${product.name}`);
          }
          if (variant.stock < item.quantity) {
            throw new ApiError(400, `Not enough stock for ${product.name} (${variant.size}${variant.color ? ' - ' + variant.color : ''})`);
          }
          unitPrice = variant.price !== null ? Number(variant.price) : Number(product.basePrice);
          stockField = { variants: { where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } } };
        } else {
          const defaultVariant = product.variants.find(
            (v) => v.size === item.size && (!item.color || v.color === item.color)
          );
          if (!defaultVariant) {
            throw new ApiError(400, `Selected size not available for ${product.name}`);
          }
          if (defaultVariant.stock < item.quantity) {
            throw new ApiError(400, `Not enough stock for ${product.name} (size ${item.size})`);
          }
          unitPrice = defaultVariant.price !== null ? Number(defaultVariant.price) : Number(product.basePrice);
          variant = defaultVariant;
          stockField = { variants: { where: { id: defaultVariant.id }, data: { stock: { decrement: item.quantity } } } };
        }

        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItemsInput.push({
          productId: item.productId,
          variantId: variant?.id ?? null,
          quantity: item.quantity,
          price: unitPrice as any,
          size: item.size,
          color: item.color || null,
        });

        await tx.product.update({
          where: { id: item.productId },
          data: stockField,
        });
      }

      const totalAmount = subtotal + Number(deliveryCharge);
      const orderNumber = generateOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          address,
          district,
          area,
          orderNotes: orderNotes || null,
          status: 'PENDING',
          subtotal: subtotal as any,
          deliveryCharge: Number(deliveryCharge) as any,
          totalAmount: totalAmount as any,
          paymentMethod: 'COD',
          paymentStatus: 'PENDING',
          items: {
            create: orderItemsInput,
          },
        },
        include: { items: { include: { variant: true } } },
      });

      await tx.customer.upsert({
        where: { phone: customerPhone },
        update: { name: customerName, ...(customerEmail ? { email: customerEmail } : {}) },
        create: { name: customerName, phone: customerPhone, email: customerEmail || null },
      });

      return { order, totalAmount, subtotal };
    });

    const { order, totalAmount, subtotal } = result as any;

    try {
      await sendOrderConfirmationEmail(
        order.customerEmail || order.customerPhone,
        order.orderNumber,
        order.customerName,
        totalAmount
      );
    } catch (err) {
      console.error('Customer confirmation email failed:', err);
    }
    try {
      await sendOrderNotificationEmail(
        order.orderNumber,
        order.customerName,
        order.customerPhone,
        totalAmount,
        order.items.length
      );
    } catch (err) {
      console.error('Admin notification email failed:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderNumber: order.orderNumber,
        orderId: order.id,
        totalAmount,
        subtotal,
        deliveryCharge: Number(deliveryCharge),
        status: order.status,
      },
    });
  }
);

export const trackOrder = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { orderNumber } = req.params as { orderNumber: string };
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }
    res.json({ success: true, data: order });
  }
);

export const getOrdersAdmin = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { status, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const take = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;

    const [orders, total] = await Promise.all([
      db.order.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: { items: true } }),
      db.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: { orders, pagination: { total, page: Number(page), limit: take, totalPages: Math.ceil(total / take) } },
    });
  }
);

export const getOrderByIdAdmin = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const order = await db.order.findUnique({
      where: { id },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }
    res.json({ success: true, data: order });
  }
);

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { status } = req.body;
    const order = await db.order.findUnique({ where: { id } });
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }
    const updated = await db.order.update({ where: { id }, data: { status } });
    res.json({ success: true, data: updated });
  }
);
