'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductBySlug } from '@/services/product.service';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, ShoppingBag } from 'lucide-react';

export const metadata = {
  title: 'Product | OOFY',
};

export default function ProductPage() {
  const params = useParams();
  const { cart, addItem } = useCart();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addStatus, setAddStatus] = useState<'idle' | 'adding' | 'added'>('idle');

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const json = await getProductBySlug(String(params.slug));
      setData(json.product);
      if (json.product.variants?.[0]) setSelectedVariant(json.product.variants[0]);
    } catch {}
    setLoading(false);
  }, [params.slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="flex flex-col gap-2">
            <div className="h-80 w-full bg-[#F5F2E9]/30 rounded-xl animate-pulse" />
            <div className="h-6 w-full bg-[#F5F2E9]/30 rounded-lg animate-pulse" />
            <div className="h-6 w-1/2 bg-[#F5F2E9]/30 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-8 w-24 bg-[#F5F2E9]/30 rounded animate-pulse" />
            <div className="h-8 w-full bg-[#F5F2E9]/30 rounded animate-pulse" />
            <div className="h-16 w-full bg-[#F5F2E9]/30 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const product = data.product;
  const related = data.related || [];
  const inStock = selectedVariant ? selectedVariant.stock > 0 : false;
  const maxQty = selectedVariant ? selectedVariant.stock : 0;
  const price = selectedVariant?.price !== null ? selectedVariant.price : product.basePrice;
  const displayPrice = product.discountPrice !== null ? product.discountPrice : product.basePrice;
  const hasDiscount = product.discountPrice !== null;

  const availableSizes = Array.from(new Set(product.variants.map((v: any) => v.size)) as string[]);
  const colorsForSize = (size: string) =>
    Array.from(new Set(product.variants.filter((v: any) => v.size === size).map((v: any) => v.color)) as (string | null)[]);

  const variantFor = (size: string, color: string | null) =>
    product.variants.find((v: any) => v.size === size && v.color === color);

  const handleAdd = () => {
    if (!selectedVariant || !inStock) return;
    setAddStatus('adding');
    addItem({
      productId: product.id,
      slug: product.slug,
      variantId: selectedVariant.id,
      quantity: Math.min(quantity, maxQty),
      size: selectedVariant.size,
      color: selectedVariant.color ?? null,
      price: selectedVariant.price !== null ? Number(selectedVariant.price) : Number(product.basePrice),
    });
    setAddStatus('added');
    setTimeout(() => setAddStatus('idle'), 1500);
  };

  const getStatusText = (): string => {
    if (addStatus === 'adding') return 'Adding...';
    if (addStatus === 'added') return 'Added to bag';
    return 'Add to Bag';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <nav className="mb-8 text-xs text-[#111]/50">
        <Link href="/" className="hover:text-[#111]">Home</Link>
        <span className="mx-1 text-[#111]/30">/</span>
        <Link href="/shop" className="hover:text-[#111]">Shop</Link>
        <span className="mx-1 text-[#111]/30">/</span>
        <span className="text-[#111] font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="aspect-[4/5] rounded-xl rounded border border-[#111]/10 bg-[#F5F2E9]/20 overflow-hidden relative">
            <Image
              src={product.images[selectedImage]?.url}
              alt={product.name}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 90vw, 45vw"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => setSelectedImage((i: number) => (i + 1) % product.images.length)}
                className="right-6 top-6 z-20 h-10 w-10 rounded-full bg-[#F5F2E9]/90 text-[#111] flex items-center justify-center shadow-lg"
              >
                <span className="text-[12px]">›</span>
              </button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {product.images.map((img: any, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`shrink-0 h-20 w-20 rounded-md border-2 overflow-hidden ${
                  selectedImage === i ? 'border-[#111]' : 'border-transparent hover:border-[#111]/40'
                }`}
              >
                <Image src={img.url} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div>
            {product.isNewArrival && (
              <span className="inline-block mb-3 h-6 px-2 py-0.5 rounded-full border border-[#111] bg-[#111] text-[#F5F2E9] text-[10px] font-black uppercase">
                New Arrival
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111] leading-tight">
              {product.name}
            </h1>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#111]">৳{displayPrice.toLocaleString()}</span>
              {hasDiscount && (
                <span className="text-lg text-[#111]/50 line-through">
                  ৳{product.basePrice.toLocaleString()}
                </span>
              )}
            </div>
            <p className="mt-4 text-[#111]/70 leading-relaxed text-sm">{product.description}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <p className="font-bold text-[#111] text-xs uppercase tracking-wider">Size</p>
              <div className="flex gap-2">
                {availableSizes.map((s: string) => {
                  const colors = colorsForSize(s);
                  const color = colors[0];
                  const v = variantFor(s, color);
                  const disabled = !v || v.stock === 0;
                  const active = selectedVariant?.size === s;
                  return (
                    <button
                      key={`size-${s}`}
                      onClick={() => setSelectedVariant(v)}
                      disabled={disabled}
                      className={`h-10 w-10 rounded-md border flex items-center justify-center text-xs font-bold transition-colors ${
                        active
                          ? 'bg-[#111] text-[#F5F2E9] border-[#111]'
                          : disabled
                          ? 'border-[#111]/20 text-[#111]/40'
                          : 'border-[#111] text-[#111] hover:bg-[#111]/5'
                        }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedVariant && (
              <div className="flex items-center gap-4">
                <p className="font-bold text-[#111] text-xs uppercase tracking-wider">Color</p>
                {colorsForSize(selectedVariant.size).map((c: string | null) => {
                  const v = variantFor(selectedVariant.size, c);
                  const active = selectedVariant.color === c;
                  return (
                    <button
                      key={`color-${c ?? 'null'}`}
                      onClick={() => setSelectedVariant(v)}
                      className={`h-9 w-9 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        active ? 'ring-2 ring-[#111]' : 'border-[#111]/20 hover:border-[#111]'
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-full border border-[#111]/30"
                        style={{ backgroundColor: '#111111' }}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-4">
              <p className="font-bold text-[#111] text-xs uppercase tracking-wider">Availability</p>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                inStock ? 'bg-[#0B5D45]/10 text-[#0B5D45] border border-[#0B5D45]/30' : 'bg-[#111]/10 text-[#111]/50 border border-[#111]/20'
              }`}>
                {inStock ? `In stock (${selectedVariant?.stock})` : 'Out of stock'}
              </span>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <p className="font-bold text-[#111] text-xs uppercase tracking-wider">Quantity</p>
              <div className="flex items-center gap-1 border border-[#111]/20 rounded-md">
                <button
                  onClick={() => setQuantity((q: number) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="h-10 w-10 flex items-center justify-center text-[#111] hover:bg-[#111]/10"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-bold text-[#111]">{quantity}</span>
                <button
                  onClick={() => setQuantity((q: number) => Math.min(maxQty || 1, q + 1))}
                  disabled={!inStock || quantity >= (maxQty || 1)}
                  className="h-10 w-10 flex items-center justify-center text-[#111] hover:bg-[#111]/10"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Button
              onClick={handleAdd}
              disabled={!inStock || addStatus === 'adding'}
              className="w-full py-4 text-sm font-bold uppercase tracking-wider"
            >
              {getStatusText()}
            </Button>
            <a
              href="/cart"
              className="w-full py-4 text-sm font-bold uppercase tracking-wider border border-[#111] text-center block transition-colors hover:bg-[#111] hover:text-[#F5F2E9]"
            >
              Go to Cart
            </a>
          </div>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="text-3xl font-black tracking-tight text-[#111] mb-8 uppercase">You may also like</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {related.map((p: any) => (
            <div key={p.id} className="flex flex-col gap-2">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const mainImage = product.images?.[0]?.url;
  return (
    <article className="flex flex-col gap-2">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F5F2E9]/40">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 45vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          priority
        />
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <h3 className="text-sm font-black leading-tight text-[#111] line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-[#111]">৳{product.basePrice.toLocaleString()}</span>
          {product.discountPrice && (
            <span className="text-[#111]/50 line-through">৳{product.basePrice.toLocaleString()}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#111]/60 uppercase tracking-wider">
          {product.variants?.[0]?.size} · {product.variants?.[0]?.color ?? '—'}
        </div>
      </div>
    </article>
  );
}
