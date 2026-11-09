import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function GET() {
  try {
    const { data, status } = await api.get('/admin/auth/me');
    return NextResponse.json(data, { status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: err?.response?.status || 401 }
    );
  }
}