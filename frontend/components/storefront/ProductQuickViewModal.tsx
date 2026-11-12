"use client";

import { useState } from "react";
import { Product, Variant, money, productPrice } from "./types";
import { CloseButton } from "./StoreHeader";
import { FiCheck, FiShoppingBag, FiArrowRight } from "react-icons/fi";

type QuickViewModalProps = {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
};

export function ProductQuickViewModal({
  product,
  onClose,
  onAddToCart,
}: QuickViewModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    () => product.variants.find((v) => v.stock > 0) || product.variants[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const images = product.images.length > 0 ? product.images : [{ url: "/images/model-front.jpeg", alt: product.name }];
  const currentImage = images[selectedImageIndex] || images[0];

  const price = productPrice(product, selectedVariant);
  const basePriceNum = Number(product.basePrice);
  const currentPriceNum = Number(price);
  const hasDiscount =
    product.discountPrice && Number(product.discountPrice) < basePriceNum;
  const discountPercent = hasDiscount
    ? Math.round(((basePriceNum - currentPriceNum) / basePriceNum) * 100)
    : 0;

  const totalStock = product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  const isOutOfStock = totalStock === 0;

  const handleAdd = () => {
    if (!selectedVariant || isOutOfStock) return;
    onAddToCart(product, selectedVariant, quantity);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 900);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="quick-view-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="quick-view-close-bar">
          <span className="qv-tag">LOOKBOOK ARCHIVE / STUDIO CUT</span>
          <CloseButton onClick={onClose} />
        </div>

        <div className="quick-view-body">
          {/* Left Column: Visual Gallery */}
          <div className="qv-gallery-col">
            <div className="qv-main-image-wrap">
              <img
                src={currentImage.url}
                alt={currentImage.alt || product.name}
                className="qv-main-img"
              />
              {hasDiscount && (
                <span className="qv-badge-sale">-{discountPercent}% OFF</span>
              )}
            </div>

            {images.length > 1 && (
              <div className="qv-thumb-row">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`qv-thumb-btn ${
                      selectedImageIndex === idx ? "active" : ""
                    }`}
                  >
                    <img src={img.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Info & Purchase */}
          <div className="qv-info-col">
            {product.category && (
              <p className="qv-category-eyebrow">{product.category.name}</p>
            )}

            <h2 className="qv-title">{product.name}</h2>

            <div className="qv-price-row">
              <span className="qv-price">{money(currentPriceNum)}</span>
              {hasDiscount && (
                <span className="qv-strikethrough">{money(basePriceNum)}</span>
              )}
            </div>

            <p className="qv-description">
              {product.description ||
                product.shortDescription ||
                "A staple piece crafted from custom-milled heavyweight fabric. Designed with relaxed shoulders and an unforced silhouette."}
            </p>

            {/* Sizing options */}
            {product.variants.length > 0 && (
              <div className="qv-size-section">
                <div className="qv-size-header">
                  <span className="qv-label">
                    Select Size: <b>{selectedVariant?.size || "Choose"}</b>
                  </span>
                  {selectedVariant?.stock !== undefined && (
                    <span className="qv-stock-hint">
                      {selectedVariant.stock > 0
                        ? `In Stock (${selectedVariant.stock})`
                        : "Sold out"}
                    </span>
                  )}
                </div>

                <div className="qv-size-grid">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      disabled={v.stock === 0}
                      onClick={() => setSelectedVariant(v)}
                      className={`qv-size-btn ${
                        selectedVariant?.id === v.id ? "selected" : ""
                      } ${v.stock === 0 ? "out" : ""}`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Bag */}
            <div className="qv-actions-row">
              <div className="qv-qty-selector">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      Math.min(selectedVariant?.stock || 99, quantity + 1)
                    )
                  }
                  disabled={quantity >= (selectedVariant?.stock || 99)}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className={`qv-add-btn ${justAdded ? "added" : ""}`}
                disabled={isOutOfStock || !selectedVariant}
                onClick={handleAdd}
              >
                {justAdded ? (
                  <>
                    <FiCheck className="icon" /> Added to Bag
                  </>
                ) : isOutOfStock ? (
                  "Sold Out"
                ) : (
                  <>
                    <FiShoppingBag className="icon" /> Add to Bag · COD
                  </>
                )}
              </button>
            </div>

            {/* View Full Product Page link */}
            <div className="qv-footer-link">
              <a href={`/products/${product.slug}`} className="qv-details-link">
                <span>View Full Product Specifications</span>
                <FiArrowRight className="icon" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
