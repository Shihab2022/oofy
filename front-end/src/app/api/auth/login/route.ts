import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const { data, status } = await api.post('/admin/auth/login', body, {
      headers: { 'Content-Type': 'application/json' },
    });
    const res = NextResponse.json(data, { status });
    // Set the httpOnly session cookie on the frontend domain
    const setCookie = res.headers.getSetCookie?.().find((c) => c.startsWith('token='));
    if (setCookie) {
      cookies().set('token', setCookie.split(';')[0].split('=')[1], {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.response?.data?.message || 'Login failed' },
      { status: err?.response?.status || 500 }
    );
  }
}