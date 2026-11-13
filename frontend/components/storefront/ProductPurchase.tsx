"use client";
import { useState } from "react";
import { Product, Variant, money, productPrice, isFreeDeliveryProduct } from "./types";

export function ProductPurchase({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (variant: Variant, quantity: number) => void;
}) {
  const variants = product?.variants || [];
  const [variant, setVariant] = useState<Variant | undefined>(() =>
    variants.find((v) => v.stock > 0) || variants[0]
  );
  const [quantity, setQuantity] = useState(1);
  const price = productPrice(product, variant);
  const isFree = isFreeDeliveryProduct(product);
  const cleanCare = product?.careInstructions
    ?.replace(/\[FREE_DELIVERY\]/g, "")
    .trim();

  const details = [
    product?.material && `Material — ${product.material}`,
    product?.fit && `Fit — ${product.fit}`,
    cleanCare && `Care — ${cleanCare}`,
  ].filter(Boolean);

  return (
    <article className="purchase-panel">
      <div className="flex items-center gap-2">
        <p className="eyebrow">004 / OOFY essentials</p>
        {isFree && (
          <span className="badge badge-free-shipping">FREE DELIVERY</span>
        )}
      </div>
      <div className="product-title-row">
        <h1>{product?.name}</h1>
        <strong>{money(price)}</strong>
      </div>
      <p className="product-description">
        {product?.description ||
          product?.shortDescription ||
          "A considered piece made for the everyday."}
      </p>
      <div className="selector-title">
        <span>Size {variant ? `/ ${variant.size}` : ""}</span>
        <button type="button">Size guide</button>
      </div>
      <div className="size-grid">
        {variants.map((v) => (
          <button
            key={v.id}
            disabled={!v.stock}
            className={variant?.id === v.id ? "selected" : ""}
            onClick={() => {
              setVariant(v);
              setQuantity(1);
            }}
          >
            {v.size}
            {v.color ? ` / ${v.color}` : ""}
          </button>
        ))}
      </div>
      <div className="purchase-actions">
        <div className="quantity-control">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
            −
          </button>
          <span>{quantity}</span>
          <button
            onClick={() =>
              setQuantity(Math.min(variant?.stock || 1, quantity + 1))
            }
          >
            +
          </button>
        </div>
        <button
          className="add-product-button"
          disabled={!variant?.stock}
          onClick={() => variant && onAdd(variant, quantity)}
        >
          Add to bag
        </button>
      </div>
      <div className="product-details">
        <details open>
          <summary>
            Product details <span>+</span>
          </summary>
          <ul>
            {details.length ? (
              details.map((detail) => <li key={detail}>{detail}</li>)
            ) : (
              <li>Designed for daily wear with an easy, relaxed shape.</li>
            )}
          </ul>
        </details>
        <details>
          <summary>
            Shipping & returns <span>+</span>
          </summary>
          <p>
            {isFree
              ? "Free delivery included on this item across all districts of Bangladesh."
              : "Ships within 5 business days. Cash on delivery is available across Bangladesh."}
          </p>
        </details>
      </div>
    </article>
  );
}

