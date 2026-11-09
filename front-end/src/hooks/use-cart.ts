import { useCallback } from 'react';

const STORAGE_KEY = 'oofy_cart';

export type CartItem = {
  productId: string;
  slug: string;
  variantId: string | null;
  quantity: number;
  size: string;
  color: string | null;
  price: number;
};

export type Cart = CartItem[];

function readCart(): Cart {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Cart) : [];
  } catch {
    return [];
  }
}

function writeCart(cart: Cart) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function useCart() {
  const getCart = useCallback((): Cart => readCart(), []);

  const addItem = useCallback((item: CartItem) => {
    const cart = readCart();
    const existing = cart.find(
      (c) => c.productId === item.productId && c.variantId === item.variantId && c.size === item.size && c.color === item.color
    );
    const next = existing
      ? cart.map((c) => (c === existing ? { ...c, quantity: c.quantity + item.quantity } : c))
      : [...cart, item];
    writeCart(next);
    return next;
  }, []);

  const setItemQuantity = useCallback((productId: string, variantId: string | null, quantity: number) => {
    const cart = readCart();
    const next = cart.map((c) =>
      c.productId === productId && c.variantId === variantId ? { ...c, quantity: Math.max(0, quantity) } : c
    );
    writeCart(next.filter((c) => c.quantity > 0));
    return next.filter((c) => c.quantity > 0);
  }, []);

  const removeItem = useCallback((productId: string, variantId: string | null) => {
    const cart = readCart();
    const next = cart.filter((c) => !(c.productId === productId && c.variantId === variantId));
    writeCart(next);
    return next;
  }, []);

  const clearCart = useCallback(() => {
    writeCart([]);
  }, []);

  return { cart: readCart(), getCart, addItem, setItemQuantity, removeItem, clearCart };
}
