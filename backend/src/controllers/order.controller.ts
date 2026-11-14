import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from '../services/email.service';
import { parseStoreSettings } from './settings.controller';
import { syncScheduledProducts } from './product.controller';

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

    await syncScheduledProducts();

    // Validate stock and compute totals inside a transaction
    const result = await db.$transaction(async (tx) => {
      const orderItemsInput: any[] = [];
      let subtotal = 0;
      let hasFreeDeliveryProduct = false;

      const isUUID = (v?: string | null): boolean =>
        typeof v === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

      for (const item of items) {
        let product: any = null;
        if (isUUID(item.productId)) {
          product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { variants: true },
          });
        }
        if (!product) {
          product = await tx.product.findFirst({
            where: {
              OR: [
                { slug: item.productId },
                { name: { equals: item.productId, mode: 'insensitive' } },
              ],
            },
            include: { variants: true },
          });
        }

        if (!product || !product.isPublished) {
          throw new ApiError(400, `Product "${item.productId}" is not available or unpublished`);
        }

        let variant: any = null;
        if (item.variantId && isUUID(item.variantId)) {
          variant = product.variants.find((v: any) => v.id === item.variantId);
        }
        if (!variant && item.size) {
          variant = product.variants.find(
            (v: any) =>
              v.size.toLowerCase() === String(item.size).toLowerCase() &&
              (!item.color || !v.color || v.color.toLowerCase() === String(item.color).toLowerCase())
          );
        }
        if (!variant && item.size) {
          variant = product.variants.find(
            (v: any) => v.size.toLowerCase() === String(item.size).toLowerCase()
          );
        }
        if (!variant && product.variants.length > 0) {
          variant = product.variants[0];
        }

        if (variant && Number(variant.stock) < Number(item.quantity)) {
          throw new ApiError(
            400,
            `Not enough stock for "${product.name}" (Size: ${variant.size || item.size}). Available: ${variant.stock}`
          );
        }

        // Calculate unit price considering active discounts
        const basePrice = Number(product.basePrice);
        const hasDiscount =
          product.discountPrice !== null &&
          product.discountPrice !== undefined &&
          Number(product.discountPrice) > 0 &&
          Number(product.discountPrice) < basePrice;

        let unitPrice = hasDiscount ? Number(product.discountPrice) : basePrice;

        if (variant && variant.price !== null && variant.price !== undefined && Number(variant.price) > 0) {
          unitPrice = Number(variant.price);
        }

        const isFree = Boolean(
          product.careInstructions?.includes('[FREE_DELIVERY]') ||
          product.description?.includes('[FREE_DELIVERY]') ||
          product.shortDescription?.includes('[FREE_DELIVERY]')
        );
        if (isFree) {
          hasFreeDeliveryProduct = true;
        }

        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItemsInput.push({
          productId: product.id,
          variantId: variant && isUUID(variant.id) ? variant.id : null,
          quantity: item.quantity,
          price: unitPrice as any,
          size: variant?.size || item.size || 'M',
          color: variant?.color || item.color || null,
        });

        if (variant?.id && isUUID(variant.id)) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      const parsedSettings = parseStoreSettings(settings);
      const normalizedDistrict = (district || '').trim().toLowerCase();
      let baseDelivery = Number(parsedSettings.deliveryChargeOutsideDhaka ?? 100);

      if (normalizedDistrict.includes('dhaka')) {
        baseDelivery = Number(parsedSettings.deliveryChargeInsideDhaka ?? parsedSettings.deliveryCharge ?? 60);
      } else if (parsedSettings.cityDeliveryRates) {
        for (const [cityName, rate] of Object.entries(parsedSettings.cityDeliveryRates)) {
          if (
            normalizedDistrict.includes(cityName.toLowerCase()) ||
            cityName.toLowerCase().includes(normalizedDistrict)
          ) {
            baseDelivery = Number(rate);
            break;
          }
        }
      }

      const isAnnouncementOff = parsedSettings.showAnnouncement === false;
      const hasThreshold =
        !isAnnouncementOff &&
        parsedSettings.freeShippingThreshold !== null &&
        parsedSettings.freeShippingThreshold !== undefined &&
        parsedSettings.freeShippingThreshold !== '' &&
        Number(parsedSettings.freeShippingThreshold) > 0;

      const isStorewideFreeDelivery =
        baseDelivery === 0 ||
        (hasThreshold && subtotal >= Number(parsedSettings.freeShippingThreshold));

      const isFreeShipping = hasFreeDeliveryProduct || isStorewideFreeDelivery;

      const deliveryCharge = isFreeShipping ? 0 : baseDelivery;
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

    // Send notification emails asynchronously without blocking order response
    if (order.customerEmail && order.customerEmail.includes('@')) {
      sendOrderConfirmationEmail(
        order.customerEmail,
        order.orderNumber,
        order.customerName,
        totalAmount
      ).catch((err) => console.error('Customer confirmation email failed:', err));
    }
    sendOrderNotificationEmail(
      order.orderNumber,
      order.customerName,
      order.customerPhone,
      totalAmount,
      order.items.length
    ).catch((err) => console.error('Admin notification email failed:', err));

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
