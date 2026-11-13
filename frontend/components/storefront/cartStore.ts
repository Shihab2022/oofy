"use client";

import { useEffect, useState, useCallback } from "react";
import { CartItem, Product, Variant, isFreeDeliveryProduct, productPrice } from "./types";

const STORAGE_KEY = "oofy_cart";
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
  .trim()
  .replace(/^["']|["']$/g, "");

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
  const [deliverySettings, setDeliverySettings] = useState<{
    deliveryCharge: number;
    freeShippingThreshold: number | null;
  }>({
    deliveryCharge: 60,
    freeShippingThreshold: 2000,
  });

  useEffect(() => {
    setCart(getStoredCart());

    // Load store delivery settings
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setDeliverySettings({
            deliveryCharge: Number(res.data.deliveryCharge ?? 60),
            freeShippingThreshold:
              res.data.freeShippingThreshold !== null &&
              res.data.freeShippingThreshold !== undefined
                ? Number(res.data.freeShippingThreshold)
                : 2000,
          });
        }
      })
      .catch(() => {});

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

      // Find item matching both this product AND this specific variant (size + color)
      const existingIndex = current.findIndex((item) => {
        const isSameProduct = item.product.id === product.id;
        const isSameVariant =
          (variant.id && item.variant.id && item.variant.id === variant.id) ||
          (item.variant.size === variant.size &&
            (item.variant.color || "") === (variant.color || ""));
        return isSameProduct && isSameVariant;
      });

      let updated: CartItem[];

      if (existingIndex > -1) {
        // Same product AND exact same size -> increment quantity
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
        // New item: whether brand new product OR a different size (e.g. Size M when Size L is already in the bag)
        // Initial quantity is strictly 1 (or requested quantity)
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

  const hasFreeDelivery = cart.some((item) =>
    isFreeDeliveryProduct(item.product)
  );

  const isStorewideFreeDelivery =
    deliverySettings.deliveryCharge === 0 ||
    (deliverySettings.freeShippingThreshold !== null &&
      deliverySettings.freeShippingThreshold === 0) ||
    (deliverySettings.freeShippingThreshold !== null &&
      subtotal >= deliverySettings.freeShippingThreshold);

  const shipping =
    subtotal === 0 || hasFreeDelivery || isStorewideFreeDelivery
      ? 0
      : deliverySettings.deliveryCharge;

  const total = subtotal + shipping;

  return {
    cart,
    bagOpen,
    setBagOpen,
    checkoutOpen,
    setCheckoutOpen,
    orderSuccess,
    setOrderSuccess,
    deliverySettings,
    hasFreeDelivery,
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
