"use client";

import { useEffect, useState, useCallback } from "react";
import { CartItem, Product, Variant, productPrice } from "./types";

const STORAGE_KEY = "oofy_cart";

export function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("oofy_cart_updated", { detail: items }));
  } catch (err) {
    console.error("Failed to save cart to localStorage", err);
  }
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    setCart(getStoredCart());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CartItem[]>;
      if (customEvent.detail) {
        setCart(customEvent.detail);
      } else {
        setCart(getStoredCart());
      }
    };

    window.addEventListener("oofy_cart_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("oofy_cart_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const addToCart = useCallback(
    (product: Product, variant: Variant, quantity: number = 1) => {
      setCart((current) => {
        const index = current.findIndex(
          (item) => item.product.id === product.id && item.variant.id === variant.id
        );
        let updated: CartItem[];
        if (index > -1) {
          updated = current.map((item, idx) =>
            idx === index
              ? {
                  ...item,
                  quantity: Math.min(
                    item.quantity + quantity,
                    Math.max(variant.stock || 99, 1)
                  ),
                }
              : item
          );
        } else {
          updated = [
            ...current,
            {
              product,
              variant,
              quantity: Math.min(quantity, Math.max(variant.stock || 99, 1)),
            },
          ];
        }
        saveStoredCart(updated);
        return updated;
      });
      setBagOpen(true);
    },
    []
  );

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setCart((current) => {
      let updated: CartItem[];
      if (quantity < 1) {
        updated = current.filter((_, i) => i !== index);
      } else {
        updated = current.map((item, i) =>
          i === index
            ? {
                ...item,
                quantity: Math.min(
                  quantity,
                  Math.max(item.variant.stock || 99, 1)
                ),
              }
            : item
        );
      }
      saveStoredCart(updated);
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart((current) => {
      const updated = current.filter((_, i) => i !== index);
      saveStoredCart(updated);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    saveStoredCart([]);
  }, []);

  const count = cart.reduce((n, item) => n + item.quantity, 0);

  const subtotal = cart.reduce(
    (total, item) =>
      total + Number(productPrice(item.product, item.variant)) * item.quantity,
    0
  );

  const shipping = subtotal === 0 ? 0 : subtotal >= 2000 ? 0 : 60;
  const total = subtotal + shipping;

  return {
    cart,
    bagOpen,
    setBagOpen,
    checkoutOpen,
    setCheckoutOpen,
    orderSuccess,
    setOrderSuccess,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    count,
    subtotal,
    shipping,
    total,
  };
}
