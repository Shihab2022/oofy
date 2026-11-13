"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { StoreHeader } from "../../components/storefront/StoreHeader";
import { SiteFooter } from "../../components/storefront/SiteFooter";
import { CartDrawer } from "../../components/storefront/CartDrawer";
import { CheckoutDialog } from "../../components/storefront/CheckoutDialog";
import { ProductCard } from "../../components/storefront/ProductCard";
import { ProductCardSkeleton, ProductGridSkeleton } from "../../components/storefront/ProductCardSkeleton";
import { ProductQuickViewModal } from "../../components/storefront/ProductQuickViewModal";
import { Product, Category } from "../../components/storefront/types";
import { useCart } from "../../components/storefront/cartStore";
import {
  FiSearch,
  FiSliders,
  FiX,
  FiRefreshCw,
  FiCheckCircle,
  FiShoppingBag,
  FiFilter,
} from "react-icons/fi";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
  .trim()
  .replace(/^["']|["']$/g, "");

async function fetchWithFallback(path: string) {
  const urls = [
    `/api${path}`,
    `${API}${path}`,
    `http://localhost:5000/api${path}`,
    `http://127.0.0.1:5000/api${path}`,
  ];
  const uniqueUrls = Array.from(new Set(urls));
  let lastError: any = null;
  for (const url of uniqueUrls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error(`Failed to load ${path}`);
}

export default function AllProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "featured" | "newest" | "price-asc" | "price-desc"
  >("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

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
      const [prodData, catData] = await Promise.allSettled([
        fetchWithFallback("/products?limit=200"),
        fetchWithFallback("/categories"),
      ]);

      if (prodData.status === "fulfilled" && prodData.value?.data?.products) {
        setProducts(prodData.value.data.products);
      } else {
        throw new Error("Unable to fetch catalog items. Please check your network.");
      }

      if (catData.status === "fulfilled" && Array.isArray(catData.value?.data)) {
        setCategories(catData.value.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Read URL query parameter for category on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get("category");
      if (catParam) setSelectedCategory(catParam);
      const searchParam = params.get("search");
      if (searchParam) setSearchQuery(searchParam);
    }
  }, []);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory !== "all") {
      list = list.filter(
        (p) =>
          p.category?.slug === selectedCategory ||
          p.categoryId === selectedCategory ||
          p.category?.name?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q)
      );
    }

    // In-stock only filter
    if (inStockOnly) {
      list = list.filter((p) => {
        const total = p.variants?.reduce((sum, v) => sum + Number(v.stock || 0), 0) ?? 0;
        return total > 0;
      });
    }

    // Size filter
    if (selectedSize !== "all") {
      list = list.filter((p) =>
        p.variants?.some(
          (v) =>
            v.size.toLowerCase() === selectedSize.toLowerCase() &&
            Number(v.stock) > 0
        )
      );
    }

    // Min price
    if (minPrice && !isNaN(Number(minPrice))) {
      list = list.filter((p) => Number(p.basePrice) >= Number(minPrice));
    }

    // Max price
    if (maxPrice && !isNaN(Number(maxPrice))) {
      list = list.filter((p) => Number(p.basePrice) <= Number(maxPrice));
    }

    // Sorting
    if (sortBy === "price-asc") {
      list.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    } else if (sortBy === "newest") {
      list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    } else {
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return list;
  }, [
    products,
    selectedCategory,
    searchQuery,
    inStockOnly,
    selectedSize,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // Unique sizes available across catalog
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.variants?.forEach((v) => {
        if (v.size) set.add(v.size.toUpperCase());
      });
    });
    return Array.from(set).sort();
  }, [products]);

  // Derived category list
  const categoryOptions = useMemo(() => {
    const list = [{ slug: "all", name: "All Pieces", count: products.length }];
    categories.forEach((cat) => {
      const count = products.filter(
        (p) => p.category?.slug === cat.slug || p.categoryId === cat.id
      ).length;
      list.push({ slug: cat.slug, name: cat.name, count });
    });
    return list;
  }, [categories, products]);

  const hasActiveFilters =
    selectedCategory !== "all" ||
    searchQuery !== "" ||
    selectedSize !== "all" ||
    inStockOnly ||
    minPrice !== "" ||
    maxPrice !== "";

  const resetAllFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setSelectedSize("all");
    setInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("featured");
  };

  return (
    <main className="store-main-wrapper bg-[#f7f5f0] min-h-screen text-[#111]">
      <StoreHeader cartCount={count} onCart={() => setBagOpen(true)} />

      {/* Order Success Toast */}
      {orderSuccess && (
        <div className="order-notification-toast">
          <div className="toast-content">
            <FiCheckCircle className="toast-icon-success" />
            <div>
              <strong>Order Placed Successfully</strong>
              <p>{orderSuccess}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOrderSuccess(null)}
            className="toast-close-btn"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Catalog Title Header */}
      <section className="border-b border-[#111] px-5 py-10 md:px-12 md:py-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-xs font-bold uppercase tracking-[0.2em] text-[#666]">
              OOFY Archive & Drops
            </p>
            <h1 className="mt-2 text-4xl sm:text-6xl font-black uppercase tracking-[-0.06em]">
              The Full <i>Catalog.</i>
            </h1>
            <p className="mt-3 text-sm text-[#555] max-w-lg">
              Every considered cut, 400 GSM fleece drop, and relaxed essential produced
              at our Dhaka studio. Filter by fit, size, or price.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#111] text-[#f7f5f0] px-4 py-2 text-xs font-black uppercase tracking-wider">
              {filteredProducts.length} {filteredProducts.length === 1 ? "Piece" : "Pieces"} Listed
            </span>
          </div>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <section className="max-w-7xl mx-auto px-5 py-8 md:px-12">
        <div className="rounded-2xl border border-black/10 bg-white p-5 md:p-6 shadow-sm space-y-5">
          {/* Row 1: Search & Sort */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Search Box */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input
                type="text"
                placeholder="Search pieces by name, fabric, or color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-black/15 bg-[#fbfbf9] pl-10 pr-9 py-2.5 text-xs outline-none focus:border-[#111] focus:bg-white transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  <FiX />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-[#666] hidden sm:inline">
                Sort:
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-black/15 bg-[#fbfbf9] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#111] outline-none cursor-pointer focus:border-[#111]"
                >
                  <option value="featured">Featured Drops</option>
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categoryOptions.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat.slug
                    ? "bg-[#111] text-[#f7f5f0] shadow-sm"
                    : "bg-[#f4f2ec] text-[#444] hover:bg-[#eae6dc]"
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          {/* Row 3: Extended Filters (Size, In-Stock, Price Range) */}
          <div className="pt-3 border-t border-black/8 flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Size Filter */}
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[#666]">
                Size:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSize("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase transition ${
                  selectedSize === "all"
                    ? "bg-[#111] text-white"
                    : "bg-[#f4f2ec] text-[#555] hover:bg-[#eae6dc]"
                }`}
              >
                All
              </button>
              {availableSizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase transition ${
                    selectedSize === sz
                      ? "bg-[#111] text-white"
                      : "bg-[#f4f2ec] text-[#555] hover:bg-[#eae6dc]"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* In-Stock Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer font-bold uppercase tracking-wider text-[#111]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded accent-[#111] cursor-pointer"
              />
              <span>In-Stock Only</span>
            </label>

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[#666]">
                Price (৳):
              </span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-20 rounded-lg border border-black/15 bg-[#fbfbf9] px-2 py-1 text-xs outline-none focus:border-[#111]"
              />
              <span>–</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-20 rounded-lg border border-black/15 bg-[#fbfbf9] px-2 py-1 text-xs outline-none focus:border-[#111]"
              />
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 uppercase tracking-wider transition cursor-pointer"
              >
                Reset Filters ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Catalog Grid Section */}
      <section className="max-w-7xl mx-auto px-5 pb-20 md:px-12">
        {/* Error message */}
        {error && !isLoading && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 text-center">
            <p className="text-sm font-bold text-rose-900">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#111] px-4 py-2 text-xs font-bold uppercase text-white"
            >
              <FiRefreshCw /> Retry Loading Catalog
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && <ProductGridSkeleton count={8} />}

        {/* Product Cards */}
        {!isLoading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <div className="rounded-3xl border border-black/10 bg-white p-12 text-center max-w-lg mx-auto my-8">
            <FiShoppingBag className="mx-auto text-4xl text-gray-400 mb-3" />
            <h3 className="text-lg font-black uppercase text-[#111]">
              No Pieces Match Your Filters
            </h3>
            <p className="mt-1 text-xs text-[#666] leading-relaxed">
              We couldn't find any garments matching your search, size, or price criteria.
              Try resetting your filters to see available pieces.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-5 rounded-xl bg-[#111] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-black/80"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </section>

      {/* Interactive Quick View Modal */}
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

      {/* Cart Drawer */}
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

      {/* Checkout Dialog */}
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

      <SiteFooter />
    </main>
  );
}
