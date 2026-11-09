'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const mainImage = product.images[0]?.url;
  const firstVariant = product.variants[0];
  const price = product.discountPrice ?? product.basePrice;
  const hasDiscount = product.discountPrice !== null;
  const inStock = firstVariant ? firstVariant.stock > 0 : false;

  const handleAdd = () => {
    if (!firstVariant) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      variantId: firstVariant.id,
      quantity: 1,
      size: firstVariant.size,
      color: firstVariant.color ?? null,
      price,
    });
  };

  return (
    <article className="flex flex-col group relative">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F5F2E9]/40">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 45vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          priority
        />
        {product.isNewArrival && (
          <span className="absolute top-3 left-3 z-10 flex h-6 items-center rounded-full border border-[#111] bg-[#111] px-2 py-0.5 text-[#F5F2E9] text-[10px] font-black uppercase">
            New
          </span>
        )}
        {hasDiscount && (
          <span className="absolute top-3 right-3 z-10 flex h-6 items-center rounded-full border border-[#0B5D45] bg-[#0B5D45] px-2 py-0.5 text-[#F5F2E9] text-[10px] font-black uppercase">
            Sale
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm font-black leading-tight text-[#111] line-clamp-1 group-hover:text-[#0B5D45]">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-[#111]">৳{price.toLocaleString()}</span>
          {hasDiscount && (
            <span className="text-sm text-[#111]/50 line-through">৳{product.basePrice.toLocaleString()}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#111]/60 uppercase tracking-wider">
          {firstVariant?.size} · {firstVariant?.color ?? '—'}
        </div>
      </div>
      <Button
        onClick={(e) => { e.preventDefault(); handleAdd(); }}
        disabled={!inStock}
        variant={inStock ? 'default' : 'outline'}
        className="w-full text-xs py-2 mt-auto"
      >
        {inStock ? 'Add to Bag' : 'Unavailable'}
      </Button>
    </article>
  );
}
