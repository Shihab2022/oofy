"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CartDrawer } from "../../../components/storefront/CartDrawer";
import { CheckoutDialog } from "../../../components/storefront/CheckoutDialog";
import { RelatedProducts } from "../../../components/storefront/HomeSections";
import { ProductGallery } from "../../../components/storefront/ProductGallery";
import { ProductPurchase } from "../../../components/storefront/ProductPurchase";
import { SiteFooter } from "../../../components/storefront/SiteFooter";
import { StoreHeader } from "../../../components/storefront/StoreHeader";
import { Product, Variant } from "../../../components/storefront/types";
import { useCart } from "../../../components/storefront/cartStore";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
  .trim()
  .replace(/^["']|["']$/g, "");

export default function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [error, setError] = useState("");

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
    clearCart,
    count,
    shipping,
  } = useCart();

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`${API}/products/${slug}`).then((r) =>
        r.json().then((data) => ({ ok: r.ok, data }))
      ),
      fetch(`${API}/products?limit=8`).then((r) => r.json()),
    ])
      .then(([result, catalog]) => {
        if (!result.ok) {
          setError(result.data.message || "Product not found");
          return;
        }
        setProduct(result.data.data.product);
        setRelated(
          (catalog.data?.products || [])
            .filter((item: Product) => item.slug !== slug)
            .slice(0, 3)
        );
      })
      .catch(() => setError("Could not load product."));
  }, [slug]);

  if (error)
    return (
      <main className="state-page">
        <h1>{error}</h1>
        <a href="/">Back to shop</a>
      </main>
    );

  if (!product)
    return <main className="state-page">Loading product…</main>;

  return (
    <main>
      <StoreHeader back cartCount={count} onCart={() => setBagOpen(true)} />
      <section className="product-page">
        <ProductGallery product={product} />
        <ProductPurchase
          product={product}
          onAdd={(variant: Variant, quantity: number) =>
            addToCart(product, variant, quantity)
          }
          onBuyNow={(variant: Variant, quantity: number) => {
            addToCart(product, variant, quantity);
            setBagOpen(false);
            setCheckoutOpen(true);
          }}
        />
      </section>
      <RelatedProducts products={related} />
      <section className="product-banner">
        <p>Made to be worn. Made to move.</p>
        <span>OOFY / 004</span>
      </section>
      <SiteFooter />
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
      {checkoutOpen && (
        <CheckoutDialog
          items={cart}
          shipping={shipping}
          onClose={() => setCheckoutOpen(false)}
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
