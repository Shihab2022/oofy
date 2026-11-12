"use client";

import { useState, useMemo } from "react";
import { Product, Category, Variant, money, productPrice } from "./types";
import { ProductCard } from "./ProductCard";
import { ProductGridSkeleton } from "./ProductCardSkeleton";
import {
  FiArrowUpRight,
  FiSearch,
  FiX,
  FiRefreshCw,
  FiCheck,
  FiTruck,
  FiRepeat,
  FiShield,
  FiSliders,
} from "react-icons/fi";

// Hero Section
export function Hero() {
  return (
    <section className="hero-banner">
      <div className="hero-copy-col">
        <div className="hero-badge-row">
          <span className="hero-pill">SEASON 004 / 2026</span>
          <span className="hero-subpill">HEAVYWEIGHT ESSENTIALS</span>
        </div>

        <h1 className="hero-headline">
          TAKE
          <br />
          <i>ACTION.</i>
        </h1>

        <p className="hero-subtext">
          Engineered for the daily uniform. Custom-milled fabrics, relaxed boxy
          fits, and considered construction crafted right here in Dhaka.
        </p>

        <div className="hero-cta-group">
          <a href="#collection" className="hero-primary-btn">
            <span>Explore The Drop</span>
            <span className="hero-arrow">↘</span>
          </a>
          <a href="#manifesto" className="hero-ghost-btn">
            Read Manifesto
          </a>
        </div>

        <div className="hero-specs-strip">
          <div className="spec-item">
            <strong>400 GSM</strong>
            <span>French Terry</span>
          </div>
          <div className="spec-divider" />
          <div className="spec-item">
            <strong>DHAKA</strong>
            <span>Atelier Made</span>
          </div>
          <div className="spec-divider" />
          <div className="spec-item">
            <strong>COD</strong>
            <span>Nationwide</span>
          </div>
        </div>
      </div>

      <div className="hero-visual-col">
        <div className="hero-image-wrap">
          <img
            src="/images/model-front.jpeg"
            alt="OOFY Contemporary Collection Model"
            className="hero-img"
          />
          <div className="hero-image-overlay" />
          <div className="hero-floating-tag">
            <span className="tag-dot" />
            <span>OOFY® BOX HOODIE & TEE</span>
          </div>
          <p className="hero-image-caption">
            Made to be worn
            <br />
            <strong>your way.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}

// Marquee / Brand Ticker Strip
export function MarqueeTicker() {
  const items = [
    "NEW DROP 004",
    "WORLDWIDE AESTHETIC",
    "CASH ON DELIVERY BANGLADESH",
    "400 GSM FRENCH TERRY",
    "UNFORCED SILHOUETTES",
    "EASY 14-DAY EXCHANGES",
    "WEAR YOUR CONFIDENCE",
    "ETHICALLY CRAFTED IN DHAKA",
  ];

  return (
    <div className="marquee-wrapper" aria-hidden="true">
      <div className="marquee-track">
        {items.concat(items).map((item, idx) => (
          <span key={idx} className="marquee-item">
            {item} <span className="marquee-star">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Collection Filter & Product Grid Section
type ProductCollectionProps = {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAddToCart?: (product: Product, variant: Variant, quantity: number) => void;
};

export function ProductCollection({
  products,
  categories,
  isLoading,
  error,
  onRetry,
  onAddToCart,
}: ProductCollectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "featured" | "price-asc" | "price-desc" | "newest"
  >("featured");

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory !== "all") {
      list = list.filter(
        (p) =>
          p.category?.slug === selectedCategory ||
          p.categoryId === selectedCategory ||
          p.category?.name?.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q),
      );
    }

    // Sorting
    if (sortBy === "price-asc") {
      list.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    } else if (sortBy === "newest") {
      list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    } else {
      // featured
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Dynamic category options derived from categories + existing products
  const categoryOptions = useMemo(() => {
    const list = [{ slug: "all", name: "All Drops", count: products.length }];

    categories.forEach((cat) => {
      const count = products.filter(
        (p) => p.category?.slug === cat.slug || p.categoryId === cat.id,
      ).length;
      list.push({ slug: cat.slug, name: cat.name, count });
    });

    // Also include any categories present in products that weren't in categories API
    products.forEach((p) => {
      if (p.category?.slug && !list.some((c) => c.slug === p.category?.slug)) {
        const count = products.filter(
          (item) => item.category?.slug === p.category?.slug,
        ).length;
        list.push({ slug: p.category.slug, name: p.category.name, count });
      }
    });

    return list;
  }, [categories, products]);

  return (
    <section id="collection" className="collection-section">
      {/* Collection Heading */}
      <div className="collection-header">
        <div className="collection-heading-left">
          <p className="eyebrow">01 / Curated Catalog</p>
          <h2 className="collection-title">
            THE STAPLES <i>ARE IN.</i>
          </h2>
          <p className="collection-description">
            Pieces that work hard, stay close, and make every day feel
            considered.
          </p>
        </div>

        <div className="collection-heading-right">
          <div className="catalog-status-badge">
            <span className="pulse-dot" />
            <span>Drop 004 Available Now</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="catalog-controls">
        <div className="category-scroll-wrapper">
          <div className="category-pills">
            {isLoading && categoryOptions.length <= 1 ? (
              <>
                <div className="skeleton-pill" />
                <div className="skeleton-pill" />
                <div className="skeleton-pill" />
              </>
            ) : (
              categoryOptions.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`category-pill-btn ${
                    selectedCategory === cat.slug ? "active" : ""
                  }`}
                >
                  <span>{cat.name}</span>
                  {!isLoading && <span className="cat-count">{cat.count}</span>}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="controls-secondary">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search pieces…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="clear-search-btn"
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          <div className="sort-dropdown-wrap">
            <FiSliders className="sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
              aria-label="Sort products"
            >
              <option value="featured">Featured Drops</option>
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Header Info */}
      <div className="catalog-meta-bar">
        <p className="catalog-count-label">
          {isLoading ? (
            "Loading pieces…"
          ) : (
            <>
              Showing <b>{filteredProducts.length}</b> of{" "}
              <b>{products.length}</b>{" "}
              {products.length === 1 ? "piece" : "pieces"}
              {selectedCategory !== "all" && (
                <span>
                  {" "}
                  in{" "}
                  {
                    categoryOptions.find((c) => c.slug === selectedCategory)
                      ?.name
                  }
                </span>
              )}
            </>
          )}
        </p>

        {(selectedCategory !== "all" || searchQuery) && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="reset-filters-btn"
          >
            Reset filters ✕
          </button>
        )}
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="catalog-error-card">
          <p className="error-title">Unable to load the collection</p>
          <p className="error-message">{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="retry-btn">
              <FiRefreshCw className="icon" /> Retry Connection
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton Grid */}
      {isLoading && <ProductGridSkeleton count={6} />}

      {/* Loaded Products Grid */}
      {!isLoading && !error && filteredProducts.length > 0 && (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {/* Empty Filter State */}
      {!isLoading && !error && filteredProducts.length === 0 && (
        <div className="catalog-empty-state">
          <div className="empty-icon-circle">
            <FiSearch />
          </div>
          <h3>No matching pieces found</h3>
          <p>
            We couldn’t find anything matching your selection. Try clearing
            filters or searching for a different item.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="empty-reset-btn"
          >
            View All Pieces
          </button>
        </div>
      )}
    </section>
  );
}

// Craftsmanship / Brand Pillars Section
export function CraftsmanshipSection() {
  const pillars = [
    {
      num: "01",
      title: "400 GSM French Terry",
      description:
        "Custom-developed heavyweight cotton engineered to hold its structured silhouette through years of continuous wear.",
      icon: FiShield,
    },
    {
      num: "02",
      title: "Unforced Silhouette",
      description:
        "Subtle drop-shoulder architecture with calibrated body drape for a relaxed, confident profile.",
      icon: FiSliders,
    },
    {
      num: "03",
      title: "Dhaka Atelier Crafted",
      description:
        "Ethically cut and assembled with reinforced flatlock stitching by master artisans in Dhaka, Bangladesh.",
      icon: FiRepeat,
    },
    {
      num: "04",
      title: "Cash on Delivery",
      description:
        "Inspect your package at your doorstep before paying anywhere across all 64 districts in Bangladesh.",
      icon: FiTruck,
    },
  ];

  return (
    <section className="craftsmanship-section">
      <div className="craft-header">
        <p className="eyebrow">Built Without Compromise</p>
        <h2 className="craft-title">
          HONEST MATERIALS.
          <br />
          <i>CALIBRATED FITS.</i>
        </h2>
      </div>

      <div className="craft-grid">
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.num} className="craft-card">
              <div className="craft-card-top">
                <span className="craft-num">{p.num}</span>
                <Icon className="craft-icon" />
              </div>
              <h3 className="craft-card-title">{p.title}</h3>
              <p className="craft-card-desc">{p.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Brand Manifesto Section
export function Manifesto() {
  return (
    <section id="manifesto" className="manifesto-section">
      <div className="manifesto-image-wrap">
        <img
          src="/images/model-back.jpeg"
          alt="OOFY Silhouette Back View"
          className="manifesto-img"
        />
        <div className="manifesto-badge">
          <span>OOFY ATELIER · 004</span>
        </div>
      </div>

      <div className="manifesto-content">
        <p className="eyebrow">Designed in Dhaka</p>
        <h2 className="manifesto-headline">
          DO WHAT YOU NEED
          <br />
          TO GET WHAT
          <br />
          <i>YOU WANT.</i>
        </h2>
        <p className="manifesto-p">
          OOFY was created for those who move through the world with deliberate
          purpose. We reject the cycle of throwaway fashion in favor of heavy,
          honest garments built with intention.
        </p>
        <p className="manifesto-sub">
          Every seam, hem, and stitch is calculated to deliver effortless
          presence wherever you go.
        </p>

        <a href="#collection" className="manifesto-link">
          <span>Explore All Releases</span>
          <FiArrowUpRight className="icon" />
        </a>
      </div>
    </section>
  );
}

// Studio Visual Lookbook Strip
type LookbookSectionProps = {
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
};

export function LookbookSection({
  products = [],
  onSelectProduct,
}: LookbookSectionProps) {
  const p1 = products[0];
  const p2 = products[1] || products[0];
  const p3 = products[2] || products[0];

  const handleCardClick = (product?: Product) => {
    if (product && onSelectProduct) {
      onSelectProduct(product);
    } else {
      const collectionEl = document.getElementById("collection");
      if (collectionEl) {
        collectionEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const items = [
    {
      id: "cut-01",
      product: p1,
      image: "/images/tee-hanging.jpeg",
      label: "STUDIO CUT 01",
      fallbackTitle: "Heavyweight Studio Tee",
      aspectClass: "item-large",
    },
    {
      id: "cut-02",
      product: p2,
      image: "/images/tee-grid.jpeg",
      label: "STUDIO CUT 02",
      fallbackTitle: "French Terry Knitwear",
      aspectClass: "",
    },
    {
      id: "cut-03",
      product: p3,
      image: "/images/model-front.jpeg",
      label: "STUDIO CUT 03",
      fallbackTitle: "The Everyday Uniform",
      aspectClass: "",
    },
  ];

  return (
    <section className="lookbook-section">
      <div className="lookbook-header">
        <div>
          <p className="eyebrow">Visual Study / 004</p>
          <h2 className="lookbook-title">LOOKBOOK ARCHIVE</h2>
        </div>
        <p className="lookbook-caption">
          Click any study card to inspect the piece, check available sizing, and add to your bag.
        </p>
      </div>

      <div className="lookbook-grid">
        {items.map((item) => {
          const prod = item.product;
          const title = prod ? prod.name : item.fallbackTitle;
          const priceStr = prod ? money(productPrice(prod)) : "";
          const categoryName = prod?.category?.name || "Drop 004";

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              className={`lookbook-item ${item.aspectClass} clickable-lookbook-card`}
              onClick={() => handleCardClick(prod)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(prod);
                }
              }}
              aria-label={`View lookbook piece: ${title}`}
            >
              <img src={item.image} alt={title} />

              <div className="lookbook-hover-pill">
                <span>Inspect Piece ↗</span>
              </div>

              <div className="lookbook-overlay">
                <span className="lb-label">
                  {item.label} · {categoryName}
                </span>
                <span className="lb-sub">{title}</span>
                {priceStr && <strong className="lb-price">{priceStr}</strong>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Service Trust Strip
export function ServiceStrip() {
  return (
    <section className="service-strip-v2">
      <div className="service-item">
        <div className="service-icon-box">
          <FiTruck />
        </div>
        <div>
          <p className="service-num">01 / FAST FULFILLMENT</p>
          <h4>Ships Nationwide</h4>
          <p className="service-desc">
            Delivered to your door within 48 to 72 hours.
          </p>
        </div>
      </div>

      <div className="service-item">
        <div className="service-icon-box">
          <FiShield />
        </div>
        <div>
          <p className="service-num">02 / RISK-FREE PAYMENT</p>
          <h4>Cash on Delivery</h4>
          <p className="service-desc">
            Pay upon doorstep arrival in all 64 districts.
          </p>
        </div>
      </div>

      <div className="service-item">
        <div className="service-icon-box">
          <FiRepeat />
        </div>
        <div>
          <p className="service-num">03 / GUARANTEED FIT</p>
          <h4>Easy 14-Day Returns</h4>
          <p className="service-desc">
            Hassle-free size exchanges and returns.
          </p>
        </div>
      </div>
    </section>
  );
}

// VIP Drop List / Newsletter
export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <section className="newsletter-section">
      <div className="newsletter-card">
        <div className="newsletter-content">
          <p className="eyebrow">Inner Circle</p>
          <h2>JOIN THE DROP LIST.</h2>
          <p>
            Get early private access to limited releases, secret restocks, and
            studio previews before public launch.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="newsletter-form">
          {subscribed ? (
            <div className="subscribed-toast">
              <FiCheck className="toast-icon" />
              <span>You’re on the list. Watch your inbox for Drop 005.</span>
            </div>
          ) : (
            <div className="newsletter-input-group">
              <input
                type="email"
                required
                placeholder="Enter your email address…"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-submit-btn">
                Subscribe
              </button>
            </div>
          )}
          <small className="newsletter-disclaimer">
            Zero spam. Unsubscribe at any time with one click.
          </small>
        </form>
      </div>
    </section>
  );
}

// Related Products (used in product details page)
export function RelatedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="related-products-v2">
      <div className="related-heading-v2">
        <div>
          <p className="eyebrow">Wear it with</p>
          <h2>Complete the set</h2>
        </div>
        <a href="/#collection" className="text-link">
          All Products →
        </a>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

// Backward compatibility export
export const CollectionIntro = () => null;
