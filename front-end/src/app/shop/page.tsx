'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getProducts, getCategories } from '@/services/product.service';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label'; import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/use-cart';
import type { Category } from '@/types';

const SIZES = ['M', 'L', 'XL'];

export default function ShopPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { cart, addItem } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const size = searchParams.get('size') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = searchParams.get('page') || '1';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (query) params.q = query;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (size) params.size = size;
      params.sort = sort;
      params.page = page;
      params.limit = '24';

      const data = await getProducts(params);
      setProducts(data.products || []);
      setPagination(data.pagination || {});
    } catch {
      setProducts([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  }, [query, category, minPrice, maxPrice, size, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0 space-y-8">
          <div className="space-y-4">
            <p className="font-black uppercase tracking-tighter text-[10px] text-[#111] mb-2">
              Search
            </p>
            <Input
              value={query}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Search products"
            />
          </div>

          <div className="space-y-4">
            <p className="font-black uppercase tracking-tighter text-[10px] text-[#111] mb-2">
              Category
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setParam('category', '')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm text-left transition-colors ${
                  !category ? 'bg-[#111] text-[#F5F2E9]' : 'text-[#111] hover:bg-[#111]/5'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setParam('category', cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm text-left transition-colors ${
                    category === cat.slug ? 'bg-[#111] text-[#F5F2E9]' : 'text-[#111] hover:bg-[#111]/5'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-black uppercase tracking-tighter text-[10px] text-[#111] mb-2">
              Size
            </p>
            <div className="space-y-2">
              {SIZES.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={size === s}
                    onCheckedChange={() => setParam('size', s)}
                  />
                  <span className="text-sm text-[#111]">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-black uppercase tracking-tighter text-[10px] text-[#111] mb-2">
              Price (৳)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                value={minPrice}
                onChange={(e) => setParam('minPrice', e.target.value)}
                placeholder="Min"
              />
              <Input
                type="number"
                value={maxPrice}
                onChange={(e) => setParam('maxPrice', e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="text-[#111]/60 text-sm">
              Showing{' '}
              <span className="font-black text-[#111]">
                {products.length} of {pagination.total ?? 0}
              </span>
            </div>
            <Select value={sort} onValueChange={(v) => setParam('sort', v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <div key={product.id} className="flex flex-col gap-2">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {pagination.totalPages && pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-between text-sm">
              <div className="flex gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setParam('page', String(p))}
                      className={`w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center transition-colors ${
                        String(p) === page
                          ? 'bg-[#111] text-[#F5F2E9]'
                          : 'border border-[#111]/20 text-[#111] hover:bg-[#111]/5'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
              <div className="text-[#111]/60">
                Page {page} of {pagination.totalPages}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}