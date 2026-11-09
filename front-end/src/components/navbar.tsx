'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, ShoppingBag, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { cart } = useCart();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setIsAdmin(Boolean(data?.success));
      })
      .catch(() => {})
      .finally(() => setChecking(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-[#F5F2E9]/80 backdrop-blur border-b border-[#111]/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-black tracking-tighter text-[#111] text-xs md:text-sm uppercase">
              OOFY
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider">
            <Link href="/" className="text-[#111]/70 hover:text-[#111]">
              Home
            </Link>
            <Link href="/shop" className="text-[#111]/70 hover:text-[#111]">
              Shop
            </Link>
            <Link href="/about" className="text-[#111]/70 hover:text-[#111]">
              About
            </Link>
            <Link href="/contact" className="text-[#111]/70 hover:text-[#111]">
              Contact
            </Link>
            {isAdmin ? (
              <Link href="/admin" className="text-[#111]/70 hover:text-[#111]">
                Admin
              </Link>
            ) : (
              <a href="/admin/login" className="text-[#111]/70 hover:text-[#111]">
                Admin Login
              </a>
            )}
            <a
              href="/cart"
              className="relative text-[#111]/70 hover:text-[#111] group"
              aria-label={`Cart (${itemCount})`}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#0B5D45] text-[#F5F2E9] text-[10px] font-bold">
                  {itemCount}
                </span>
              )}
            </a>
            <button
              onClick={() => setSearchOpen(true)}
              className="text-[#111]/70 hover:text-[#111]"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-[#111] hover:text-[#111]"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[#F5F2E9] border-b border-[#111]/10">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="block text-[#111] font-bold uppercase tracking-wider text-xs py-2 hover:text-[#0B5D45]"
            >
              Home
            </Link>
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="block text-[#111] font-bold uppercase tracking-wider text-xs py-2 hover:text-[#0B5D45]"
            >
              Shop
            </Link>
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="block text-[#111] font-bold uppercase tracking-wider text-xs py-2 hover:text-[#0B5D45]"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="block text-[#111] font-bold uppercase tracking-wider text-xs py-2 hover:text-[#0B5D45]"
            >
              Contact
            </Link>
            <a
              href="/admin/login"
              onClick={() => setOpen(false)}
              className="block text-[#111] font-bold uppercase tracking-wider text-xs py-2 hover:text-[#0B5D45]"
            >
              Admin Login
            </a>
            <div className="pt-2">
              <a
                href="/cart"
                className="block text-[#111] font-bold uppercase tracking-wider text-xs py-2"
              >
                Cart ({itemCount})
              </a>
            </div>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-[#111]/95">
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(false)}
              className="text-[#F5F2E9] hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <input
              className="flex-1 bg-transparent border-b border-[#F5F2E9]/30 px-4 py-3 text-[#F5F2E9] text-xl outline-none placeholder-[#F5F2E9]/40"
              placeholder="Search products…"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}