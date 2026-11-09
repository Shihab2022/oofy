import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function POST() {
  try {
    await api.post('/admin/auth/logout');
  } catch {}
  const res = NextResponse.json({ success: true });
  cookies().delete('token');
  return res;
}