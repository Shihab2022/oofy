'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProductBySlug } from '@/services/product.service';
import { getSettings } from '@/services/order.service';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const router = useRouter();
  const { cart, setItemQuantity, removeItem } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s] = await Promise.all([getSettings()]);
        if (mounted) setSettings(s);
      } catch {}

      const uniqueSlugs = Array.from(new Set(cart.map((c: any) => c.slug).filter(Boolean)));
      const hydrated: any[] = [];
      for (const slug of uniqueSlugs) {
        try {
          const json = await getProductBySlug(slug);
          const product = json.product;
          cart.forEach((c: any) => {
            if (c.slug === slug) {
              const variant = product.variants.find((v: any) => v.id === c.variantId);
              hydrated.push({
                ...c,
                product,
                variant,
                linePrice: ((variant?.price ?? product.basePrice) as number) * c.quantity,
                inStock: variant ? variant.stock > 0 : false,
                variantStock: variant ? variant.stock : 0,
              });
            }
          });
        } catch {}
      }
      if (mounted) {
        setItems(hydrated);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [cart]);

  const subtotal = items.reduce((sum: number, i: any) => sum + (i.linePrice || 0), 0);
  const deliveryCharge = Number(settings?.deliveryCharge ?? 60);
  const total = subtotal + deliveryCharge;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav className="mb-8 text-xs text-[#111]/50">
        <Link href="/" className="hover:text-[#111]">Home</Link>
        <span className="mx-1 text-[#111]/30">/</span>
        <span className="text-[#111] font-medium">Cart</span>
      </nav>

      <h2 className="text-3xl font-black tracking-tight text-[#111] mb-10 uppercase">Shopping Cart</h2>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <span className="text-[#111]/50">Loading cart…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#111]/60 text-lg mb-6">Your bag is empty.</p>
          <Link href="/shop" className="bg-[#111] text-[#F5F2E9] px-6 py-3 text-xs font-bold uppercase inline-block hover:bg-[#0B5D45] transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3 space-y-6">
            {items.map((item: any) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 items-start">
                <div className="flex-shrink-0 h-24 w-18 rounded-md border border-[#111]/10 bg-[#F5F2E9]/20 overflow-hidden relative">
                  <Image
                    src={item.product.images[0]?.url}
                    alt={item.product.name}
                    fill
                    className="object-cover object-center"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <Link href={`/product/${item.product.slug}`} className="text-[#111] font-bold leading-tight line-clamp-1 hover:text-[#0B5D45]">
                      {item.product.name}
                    </Link>
                    {(!item.inStock || (item.variantStock || 0) < item.quantity) && (
                      <span className="text-xs font-bold text-[#111]/50">Limited stock</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#111]/60 mb-3">
                    <span>{item.size}</span>
                    {item.color && <span>· {item.color}</span>}
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="font-bold text-[#111]">
                      ৳{((item.variant?.price ?? item.product.basePrice) as number) * item.quantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setItemQuantity(item.productId, item.variantId, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 rounded border border-[#111] flex items-center justify-center text-xs text-[#111] hover:bg-[#111]/5 disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-[#111] font-medium">{item.quantity}</span>
                    <button
                      onClick={() =>
                        setItemQuantity(item.productId, item.variantId, item.quantity + 1)
                      }
                      disabled={
                        !item.inStock ||
                        item.quantity >= (item.variantStock || 1)
                      }
                      className="w-8 h-8 rounded border border-[#111] flex items-center justify-center text-xs text-[#111] hover:bg-[#111]/5 disabled:opacity-50"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="ml-4 text-xs font-bold text-[#111]/50 hover:text-[#111] underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-xl border border-[#111]/10 bg-[#F5F2E9]/30 p-6 sticky top-24">
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#111]/60">Subtotal</span>
                  <span className="font-bold text-[#111]">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#111]/60">Delivery charge</span>
                  <span className="font-bold text-[#111]">৳{deliveryCharge.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold text-[#111]">
                  <span>Total payable</span>
                  <span>৳{total.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-[#111]/60 mb-6">
                Cash on Delivery — pay when you receive your order.
              </p>
              <Button
                onClick={() => router.push('/checkout')}
                className="w-full py-4 text-sm font-bold uppercase tracking-wider"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
