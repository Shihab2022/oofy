"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Hero,
  MarqueeTicker,
  ProductCollection,
  CraftsmanshipSection,
  Manifesto,
  LookbookSection,
  ServiceStrip,
  NewsletterSection,
} from "../components/storefront/HomeSections";
import { SiteFooter } from "../components/storefront/SiteFooter";
import { StoreHeader } from "../components/storefront/StoreHeader";
import { CartDrawer } from "../components/storefront/CartDrawer";
import { CheckoutDialog } from "../components/storefront/CheckoutDialog";
import { ProductQuickViewModal } from "../components/storefront/ProductQuickViewModal";
import { Product, Category } from "../components/storefront/types";
import { useCart } from "../components/storefront/cartStore";
import { FiCheckCircle, FiX, FiArrowRight } from "react-icons/fi";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
  .trim()
  .replace(/^["']|["']$/g, "");

// Resilient fetch helper that handles Next.js rewrite proxy, direct backend, and IP fallbacks
async function fetchWithFallback(path: string) {
  const urls = [
    `/api${path}`, // Next.js rewrite proxy (same origin, 0 CORS)
    `${API}${path}`, // Direct configured URL
    `http://localhost:5000/api${path}`, // localhost direct
    `http://127.0.0.1:5000/api${path}`, // 127.0.0.1 direct
  ];

  const uniqueUrls = Array.from(new Set(urls));
  let lastError: any = null;

  for (const url of uniqueUrls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Failed to connect to ${path}`);
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const {
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
    shipping,
  } = useCart();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Concurrently fetch products and categories with fallback redundancy
      const [prodData, catData] = await Promise.allSettled([
        fetchWithFallback("/products?limit=100"),
        fetchWithFallback("/categories"),
      ]);

      if (prodData.status === "fulfilled" && prodData.value?.data?.products) {
        setProducts(prodData.value.data.products);
      } else {
        throw new Error(
          "We couldn't connect to the catalog server. Please check your connection or retry."
        );
      }

      if (catData.status === "fulfilled" && Array.isArray(catData.value?.data)) {
        setCategories(catData.value.data);
      }
    } catch (err: any) {
      console.error("Error loading storefront data:", err);
      setError(
        err.message ||
          "Failed to load products. The collection is temporarily unavailable."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Requirement 8: Home page shows only 6 in-stock products (stock-out and unpublished products hidden on homepage)
  const homeInStockProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (p.isPublished === false) return false;
        const totalStock =
          p.variants?.reduce((sum, v) => sum + Number(v.stock || 0), 0) ?? 0;
        return totalStock > 0;
      })
      .slice(0, 6);
  }, [products]);

  return (
    <main className="store-main-wrapper">
      {/* Global Header with Live Cart Count */}
      <StoreHeader cartCount={count} onCart={() => setBagOpen(true)} />

      {/* Order Success Banner Modal */}
      {orderSuccess && (
        <div className="order-notification-toast">
          <div className="toast-content">
            <FiCheckCircle className="toast-icon-success" />
            <div>
              <strong>Order Received</strong>
              <p>{orderSuccess}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOrderSuccess(null)}
            className="toast-close-btn"
            aria-label="Dismiss message"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <Hero />

      {/* Moving Brand Ticker */}
      <MarqueeTicker />

      {/* Product Collection: 6 In-Stock Featured Drops */}
      <ProductCollection
        products={homeInStockProducts}
        categories={categories}
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
        onAddToCart={addToCart}
      />

      {/* Explore Entire Catalog Banner Link (Item 8) */}
      <section className="catalog-browse-all-strip border-b border-[#111] bg-[#f7f5f0] py-12 px-6 text-center">
        <p className="text-xs uppercase font-bold tracking-[0.2em] text-[#666] mb-3">
          Drop 004 & Archival Essentials
        </p>
        <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#111] mb-5">
          Looking for More Cuts & Colors?
        </h3>
        <a
          href="/products"
          className="inline-flex items-center gap-3 rounded-full bg-[#111] text-[#f7f5f0] hover:bg-[#d2f83a] hover:text-[#111] px-8 py-4 text-xs font-black uppercase tracking-widest transition-all shadow-md group cursor-pointer"
        >
          <span>Explore Entire Catalog ({products.length} Pieces)</span>
          <FiArrowRight className="text-base group-hover:translate-x-1 transition-transform" />
        </a>
      </section>

      {/* Craftsmanship Spotlight */}
      <CraftsmanshipSection />

      {/* Brand Manifesto */}
      <Manifesto />

      {/* Studio Visual Lookbook - Interactive with Quick View on Click */}
      <LookbookSection
        products={homeInStockProducts}
        onSelectProduct={(p) => setQuickViewProduct(p)}
      />

      {/* Trust & Fulfillment Strip */}
      <ServiceStrip />

      {/* VIP Newsletter */}
      <NewsletterSection />

      {/* Footer */}
      <SiteFooter />

      {/* Interactive Product Quick View Modal from Lookbook */}
      {quickViewProduct && (
        <ProductQuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={(prod, variant, quantity) => {
            addToCart(prod, variant, quantity);
            setQuickViewProduct(null);
          }}
          onBuyNow={(prod, variant, quantity) => {
            addToCart(prod, variant, quantity);
            setQuickViewProduct(null);
            setBagOpen(false);
            setCheckoutOpen(true);
          }}
        />
      )}

      {/* Cart Drawer Modal */}
      {bagOpen && (
        <CartDrawer
          items={cart}
          shipping={shipping}
          onClose={() => setBagOpen(false)}
          onQuantity={updateQuantity}
          onCheckout={() => {
            setBagOpen(false);
            setCheckoutOpen(true);
          }}
        />
      )}

      {/* Cash on Delivery / Mobile Pay Checkout Dialog */}
      {checkoutOpen && (
        <CheckoutDialog
          items={cart}
          shipping={shipping}
          onClose={() => setCheckoutOpen(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onDone={(msg) => {
            clearCart();
            setCheckoutOpen(false);
            setOrderSuccess(msg);
          }}
        />
      )}
    </main>
  );
}
