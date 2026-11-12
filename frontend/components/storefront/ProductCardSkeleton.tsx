"use client";

export function ProductCardSkeleton() {
  return (
    <article className="product-card skeleton-card" aria-hidden="true">
      <div className="product-image skeleton-box">
        <div className="skeleton-shimmer" />
        <div className="skeleton-badge" />
      </div>
      <div className="product-meta">
        <div className="skeleton-meta-left">
          <div className="skeleton-line skeleton-category" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-subtitle" />
        </div>
        <div className="skeleton-meta-right">
          <div className="skeleton-line skeleton-price" />
        </div>
      </div>
      <div className="skeleton-sizes-row">
        <div className="skeleton-size-pill" />
        <div className="skeleton-size-pill" />
        <div className="skeleton-size-pill" />
        <div className="skeleton-size-pill" />
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="product-grid" aria-label="Loading collection">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}
