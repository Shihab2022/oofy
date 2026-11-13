"use client";
import { useState } from "react";
import { Product, Variant, money, productPrice, isFreeDeliveryProduct } from "./types";

export function ProductPurchase({
  product,
  onAdd,
  onBuyNow,
}: {
  product: Product;
  onAdd: (variant: Variant, quantity: number) => void;
  onBuyNow?: (variant: Variant, quantity: number) => void;
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
    ?.replace(/\[SCHEDULED:[^\]]+\]/g, "")
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
            key={v.id || v.size}
            disabled={!v.stock}
            className={variant?.id === v.id || variant?.size === v.size ? "selected" : ""}
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
      <div className="mt-6 flex flex-col gap-3 w-full">
        <div className="flex items-center gap-3 w-full">
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
            type="button"
            className="add-product-button flex-1"
            disabled={!variant?.stock}
            onClick={() => variant && onAdd(variant, quantity)}
          >
            Add to bag
          </button>
        </div>

        {onBuyNow && (
          <button
            type="button"
            className="w-full rounded-xl bg-lime py-3.5 px-6 text-xs font-black uppercase tracking-widest text-ink hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2"
            disabled={!variant?.stock}
            onClick={() => variant && onBuyNow(variant, quantity)}
          >
            <span>Instant Checkout / Buy Now</span>
            <span className="text-sm">→</span>
          </button>
        )}
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
      </div>
    </article>
  );
}
