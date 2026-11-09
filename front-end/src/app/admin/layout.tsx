'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/admin/sidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAuthed(Boolean(data?.success));
      })
      .catch(() => setAuthed(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (authed === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F5F2E9]">
        <Loader2 className="h-8 w-8 text-[#111] animate-spin" />
      </div>
    );
  }
  if (!authed) {
    router.replace('/admin/login');
    return null;
  }

  return (
    <div className="flex h-screen bg-[#F5F2E9]">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-[#F5F2E9]">{children}</div>
    </div>
  );
}