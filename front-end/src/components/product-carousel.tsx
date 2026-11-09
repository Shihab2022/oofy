'use client';

import type { Product } from '@/types';
import { ProductCard } from '@/components/product-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCarouselProps {
  title: string;
  products: Product[];
  href?: string;
}

export function ProductCarousel({ title, products, href }: ProductCarouselProps) {
  return (
    <section className="mb-20">
      <div className="flex items-end justify-between mb-8 gap-4">
        <h2 className="text-3xl font-black tracking-tight text-[#111] uppercase">{title}</h2>
        {href && (
          <a href={href} className="text-xs font-bold tracking-wider text-[#111]/70 hover:text-[#0B5D45] uppercase">
            View all
          </a>
        )}
      </div>
      <ScrollArea className="h-[460px]">
        <div className="flex gap-6 min-w-[max-content]">
          {products.map((product) => (
            <div key={product.id} className="shrink-0 w-64">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="absolute -inset-1 flex items-center justify-between pointer-events-none px-4 sm:px-6">
        <div className="pointer-events-auto flex -translate-x-1/2 items-center rounded-l-md bg-gradient-to-r from-[#F5F2E9] via-[#F5F2E9] to-transparent pr-4 sm:pr-6">
          <ChevronLeft className="h-6 w-6 text-[#111] opacity-0 group/nav:opacity-100" />
        </div>
        <div className="pointer-events-auto flex translate-x-1/2 items-center rounded-r-md bg-gradient-to-l from-transparent via-[#F5F2E9] to-[#F5F2E9] pl-4 sm:pl-6">
          <ChevronRight className="h-6 w-6 text-[#111] opacity-0 group/nav:opacity-100" />
        </div>
      </div>
    </section>
  );
}
