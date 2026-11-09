'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Cookies } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password is required'),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/admin/auth/login', data);
      if (res.status === 200) {
        const token = res.data.data?.token;
        if (token) {
          localStorage.setItem('oofy_token', token);
          Cookies.set('token', token, { sameSite: 'lax', path: '/' });
        }
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F2E9] px-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <span className="font-black text-[#111] text-xs tracking-tighter uppercase">OOFY</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-[#111] mb-2">Admin Login</h2>
        <p className="text-[#111]/60 mb-8">Sign in to manage OOFY.</p>
        {error && (
          <div className="mb-4 p-3 border rounded-md bg-[#F5F2E9]/40 text-sm text-[#111]">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Email address</Label>
            <Input {...register('email')} type="email" placeholder="admin@oofy.com" />
            {errors.email && <span className="text-xs text-[#111]/50">{errors.email.message}</span>}
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input {...register('password')} type="password" />
            {errors.password && <span className="text-xs text-[#111]/50">{errors.password.message}</span>}
          </div>
          <Button type="submit" disabled={submitting} className="w-full py-3 text-sm font-bold uppercase tracking-wider">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 text-xs text-[#111]/50 text-center">
          Default credentials are configured via ADMIN_EMAIL / ADMIN_PASSWORD env vars.
        </p>
      </div>
    </div>
  );
}