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
      paymentNumber,
      transactionId,
      items,
    } = req.body;

    const settings = await db.storeSettings.findFirst();
    if (paymentMethod === 'COD' && settings && !settings.codEnabled) {
      throw new ApiError(400, 'Cash on delivery is currently unavailable');
    }

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

        if (item.variantId) {
          variant = product.variants.find((v) => v.id === item.variantId);
          if (!variant) {
            throw new ApiError(400, `Selected variant not found for product ${product.name}`);
          }
          if (variant.stock < item.quantity) {
            throw new ApiError(400, `Not enough stock for ${product.name} (${variant.size}${variant.color ? ' - ' + variant.color : ''})`);
          }
          unitPrice = variant.price !== null ? Number(variant.price) : Number(product.basePrice);
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

        if (variant?.id) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      const hasFreeDeliveryProduct = orderItemsData.some((item) => {
        const prod = products.find((p) => p.id === item.productId);
        return (
          prod?.careInstructions?.includes('[FREE_DELIVERY]') ||
          prod?.description?.includes('[FREE_DELIVERY]') ||
          prod?.shortDescription?.includes('[FREE_DELIVERY]')
        );
      });

      const isStorewideFreeDelivery =
        Number(settings?.deliveryCharge ?? 60) === 0 ||
        (settings?.freeShippingThreshold !== null &&
          settings?.freeShippingThreshold !== undefined &&
          (Number(settings.freeShippingThreshold) === 0 ||
            subtotal >= Number(settings.freeShippingThreshold)));

      const isFreeShipping = hasFreeDeliveryProduct || isStorewideFreeDelivery;

      const deliveryCharge = isFreeShipping ? 0 : Number(settings?.deliveryCharge ?? 60);
      const totalAmount = subtotal + Number(deliveryCharge);
      const orderNumber = generateOrderNumber();

      let formattedNotes = orderNotes || '';
      if (paymentMethod !== 'COD') {
        const meta = `[Method: ${paymentMethod}${paymentNumber ? ` | Sender: ${paymentNumber}` : ''}${transactionId ? ` | TrxID: ${transactionId}` : ''}]`;
        formattedNotes = formattedNotes ? `${meta} ${formattedNotes}` : meta;
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          address,
          district,
          area,
          orderNotes: formattedNotes || null,
          status: 'PENDING',
          subtotal: subtotal as any,
          deliveryCharge: Number(deliveryCharge) as any,
          totalAmount: totalAmount as any,
          paymentMethod: paymentMethod || 'COD',
          paymentStatus: 'PENDING',
          items: {
            create: orderItemsInput,
          },
          ...(paymentMethod !== 'COD' || transactionId
            ? {
                payments: {
                  create: {
                    method: paymentMethod,
                    amount: totalAmount as any,
                    status: 'PENDING',
                    transactionId: transactionId || null,
                  },
                },
              }
            : {}),
        },
        include: { items: { include: { variant: true } }, payments: true },
      });

      await tx.customer.upsert({
        where: { phone: customerPhone },
        update: { name: customerName, ...(customerEmail ? { email: customerEmail } : {}) },
        create: { name: customerName, phone: customerPhone, email: customerEmail || null },
      });

      return { order, totalAmount, subtotal, deliveryCharge };
    });

    const { order, totalAmount, subtotal, deliveryCharge } = result as any;

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
      db.order.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: { items: true, payments: true } }),
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
