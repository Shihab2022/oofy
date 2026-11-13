"use client";

import { useState } from "react";
import { Product, Variant, money, productPrice, isFreeDeliveryProduct } from "./types";
import { FiCheck, FiShoppingBag } from "react-icons/fi";

type ProductCardProps = {
  product: Product;
  onAddToCart?: (product: Product, variant: Variant, quantity: number) => void;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(() =>
    product.variants.find((v) => v.stock > 0) || product.variants[0]
  );
  const [justAdded, setJustAdded] = useState(false);

  const primaryImage = product.images?.[0];
  const alternateImage = product.images?.[1] || primaryImage;

  const colorList = Array.from(
    new Set(product.variants.map((v) => v.color).filter(Boolean))
  );

  const price = productPrice(product, selectedVariant);
  const basePriceNum = Number(product.basePrice);
  const currentPriceNum = Number(price);
  const hasDiscount =
    product.discountPrice &&
    Number(product.discountPrice) < basePriceNum;
  const discountPercent = hasDiscount
    ? Math.round(((basePriceNum - currentPriceNum) / basePriceNum) * 100)
    : 0;

  const totalStock = product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  const isOutOfStock = totalStock === 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant || isOutOfStock) return;

    if (onAddToCart) {
      onAddToCart(product, selectedVariant, 1);
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleSelectSize = (e: React.MouseEvent, v: Variant) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(v);
  };

  return (
    <article className="product-card group" data-category={product.category?.slug}>
      <a
        href={`/products/${product.slug}`}
        className="product-card-link"
        aria-label={`View ${product.name}`}
      >
        <div className="product-image">
          {primaryImage ? (
            <img
              className="product-image-primary"
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              loading="lazy"
            />
          ) : (
            <div className="image-fallback">
              <span>OOFY</span>
            </div>
          )}

          {alternateImage && alternateImage !== primaryImage && (
            <img
              className="product-image-secondary"
              src={alternateImage.url}
              alt=""
              aria-hidden="true"
              loading="lazy"
            />
          )}

          {/* Badges */}
          <div className="product-badges">
            {isFreeDeliveryProduct(product) && (
              <span className="badge badge-free-shipping">FREE DELIVERY</span>
            )}
            {hasDiscount ? (
              <span className="badge badge-sale">-{discountPercent}%</span>
            ) : product.isNewArrival ? (
              <span className="badge badge-new">NEW DROP</span>
            ) : product.isFeatured ? (
              <span className="badge badge-featured">FEATURED</span>
            ) : null}

            {product.category?.name && (
              <span className="badge badge-category">{product.category.name}</span>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="sold-out-overlay">
              <span>SOLD OUT</span>
            </div>
          )}

          {/* Quick Add Overlay on hover */}
          {!isOutOfStock && (
            <div className="product-quick-actions" onClick={(e) => e.stopPropagation()}>
              {product.variants.length > 0 && (
                <div className="quick-size-pills">
                  {product.variants.slice(0, 5).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      disabled={v.stock === 0}
                      className={`size-pill ${
                        selectedVariant?.id === v.id ? "active" : ""
                      } ${v.stock === 0 ? "out" : ""}`}
                      onClick={(e) => handleSelectSize(e, v)}
                      title={`${v.size} (${v.stock > 0 ? "In stock" : "Sold out"})`}
                    >
                      {v.size}
                    </button>
                  ))}
                  {product.variants.length > 5 && (
                    <span className="size-pill-more">+{product.variants.length - 5}</span>
                  )}
                </div>
              )}

              <button
                type="button"
                className={`quick-add-btn ${justAdded ? "added" : ""}`}
                onClick={handleQuickAdd}
                disabled={isOutOfStock || !selectedVariant}
              >
                {justAdded ? (
                  <>
                    <FiCheck className="icon" /> Added to Bag
                  </>
                ) : (
                  <>
                    <FiShoppingBag className="icon" /> Quick Add
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="product-meta">
          <div className="meta-info">
            {product.category && (
              <span className="product-category-label">
                {product.category.name}
              </span>
            )}
            <h3 className="product-title">{product.name}</h3>
            {colorList.length > 0 && (
              <p className="product-colors">
                {colorList.length === 1
                  ? colorList[0]
                  : `${colorList.length} Colorways`}
              </p>
            )}
          </div>

          <div className="meta-price">
            <strong className="current-price">{money(currentPriceNum)}</strong>
            {hasDiscount && (
              <span className="strikethrough-price">{money(basePriceNum)}</span>
            )}
          </div>
        </div>
      </a>
    </article>
  );
}
