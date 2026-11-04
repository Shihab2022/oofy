import { prisma } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

export function toNumber(value: unknown): number {
  if (value instanceof Decimal) return value.toNumber();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  return 0;
}

export function toMoneyString(value: number | string | Decimal): string {
  return new Decimal(value).toFixed(2);
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.storeSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSetting(key: string, fallback?: string): Promise<string | null> {
  const row = await prisma.storeSetting.findUnique({ where: { key } });
  return row ? row.value : fallback ?? null;
}

/**
 * Generates a unique order number: OOFY-YYYYMMDD-XXXX
 */
export async function generateOrderNumber({
  findExisting,
}: {
  findExisting: (orderNumber: string) => Promise<{ orderNumber: string } | null>;
}): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `OOFY-${today}-`;
  let attempts = 0;
  while (attempts < 10) {
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const orderNumber = prefix + suffix;
    const existing = await findExisting(orderNumber);
    if (!existing) return orderNumber;
    attempts += 1;
  }
  throw new Error('Unable to generate a unique order number. Please try again.');
}

export function publicOrder(order: any) {
  const { idempotencyKey, ...rest } = order;
  return rest;
}
