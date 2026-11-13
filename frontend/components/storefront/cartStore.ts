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
    deliveryChargeInsideDhaka: number;
    deliveryChargeOutsideDhaka: number;
    freeShippingThreshold: number | null;
    customAnnouncement?: string;
  }>({
    deliveryCharge: 60,
    deliveryChargeInsideDhaka: 60,
    deliveryChargeOutsideDhaka: 100,
    freeShippingThreshold: 2000,
    customAnnouncement: "",
  });

  useEffect(() => {
    setCart(getStoredCart());

    // Load store delivery settings
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const inside = Number(
            res.data.deliveryChargeInsideDhaka ?? res.data.deliveryCharge ?? 60
          );
          const outside = Number(res.data.deliveryChargeOutsideDhaka ?? 100);
          setDeliverySettings({
            deliveryCharge: inside,
            deliveryChargeInsideDhaka: inside,
            deliveryChargeOutsideDhaka: outside,
            freeShippingThreshold:
              res.data.freeShippingThreshold !== null &&
              res.data.freeShippingThreshold !== undefined
                ? Number(res.data.freeShippingThreshold)
                : 2000,
            customAnnouncement: res.data.customAnnouncement || "",
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
      const current = getStoredCart();

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
        updated = current.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const newItem: CartItem = {
          product,
          variant: {
            ...variant,
            id: variant.id || `${product.id}-${variant.size}-${variant.color || "default"}`,
          },
          quantity,
        };
        updated = [newItem, ...current];
      }

      saveStoredCart(updated);
      setCart(updated);
      setBagOpen(true);
    },
    []
  );

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      const current = getStoredCart();
      const updated =
        quantity <= 0
          ? current.filter((item) => item.variant.id !== variantId)
          : current.map((item) =>
              item.variant.id === variantId ? { ...item, quantity } : item
            );
      saveStoredCart(updated);
      setCart(updated);
    },
    []
  );

  const removeFromCart = useCallback((variantId: string) => {
    const current = getStoredCart();
    const updated = current.filter((item) => item.variant.id !== variantId);
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

  const getShippingForDistrict = useCallback(
    (districtName?: string) => {
      if (subtotal === 0 || hasFreeDelivery || isStorewideFreeDelivery) {
        return 0;
      }
      const isDhaka = !districtName || districtName.toLowerCase().includes("dhaka");
      return isDhaka
        ? deliverySettings.deliveryChargeInsideDhaka
        : deliverySettings.deliveryChargeOutsideDhaka;
    },
    [subtotal, hasFreeDelivery, isStorewideFreeDelivery, deliverySettings]
  );

  const shipping =
    subtotal === 0 || hasFreeDelivery || isStorewideFreeDelivery
      ? 0
      : deliverySettings.deliveryChargeInsideDhaka;

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
    isStorewideFreeDelivery,
    getShippingForDistrict,
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
