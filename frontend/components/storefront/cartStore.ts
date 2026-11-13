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
      // Always get latest cart from localStorage to prevent stale state
      const current = getStoredCart();

      // Check if this product is already in the bag
      const existingIndex = current.findIndex(
        (item) => item.product.id === product.id
      );

      let updated: CartItem[];

      if (existingIndex > -1) {
        const existingItem = current[existingIndex];
        const isSameVariant =
          (variant.id && existingItem.variant.id && existingItem.variant.id === variant.id) ||
          (existingItem.variant.size === variant.size &&
            (existingItem.variant.color || "") === (variant.color || ""));

        if (isSameVariant) {
          // Same product and same size -> increment quantity
          updated = current.map((item, idx) =>
            idx === existingIndex
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
          // Same product but DIFFERENT size/variant (e.g. previously added L, now selected M)
          // Update the product's variant to the newly selected size,
          // and set initial quantity to requested quantity (default 1)
          // instead of adding 2 or 3 items of the same product into the bag!
          updated = current.map((item, idx) =>
            idx === existingIndex
              ? {
                  product,
                  variant,
                  quantity: Math.min(quantity, Math.max(variant.stock || 99, 1)),
                }
              : item
          );
        }
      } else {
        // Brand new product added to the bag
        updated = [
          ...current,
          {
            product,
            variant,
            quantity: Math.min(quantity, Math.max(variant.stock || 99, 1)),
          },
        ];
      }

      // Persist to storage outside of React's state updater function
      saveStoredCart(updated);
      setCart(updated);
      setBagOpen(true);
    },
    []
  );

  const updateQuantity = useCallback((index: number, quantity: number) => {
    const current = getStoredCart();
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
    setCart(updated);
  }, []);

  const removeFromCart = useCallback((index: number) => {
    const current = getStoredCart();
    const updated = current.filter((_, i) => i !== index);
    saveStoredCart(updated);
    setCart(updated);
  }, []);

  const clearCart = useCallback(() => {
    saveStoredCart([]);
    setCart([]);
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
