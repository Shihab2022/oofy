'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, Box, ShoppingBag, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Cookies } from '@/lib/api';

const NAV = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Box },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Settings', href: '/admin/settings', icon: Sliders },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('oofy_token');
    Cookies.remove('token');
    window.location.href = '/admin/login';
  };

  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r border-[#111]/10 bg-[#111]">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="font-black text-[#F5F2E9] text-xs tracking-tighter uppercase">OOFY</span>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-md transition-colors ${
                active ? 'bg-[#0B5D45] text-[#F5F2E9]' : 'text-[#F5F2E9]/70 hover:text-[#F5F2E9] hover:bg-[#1a1a1a]'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#1a1a1a]">
        <Button onClick={handleLogout} variant="outline" className="w-full text-sm text-[#F5F2E9]/90 border-[#1a1a1a] hover:bg-[#1a1a1a]">
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </aside>
  );
}