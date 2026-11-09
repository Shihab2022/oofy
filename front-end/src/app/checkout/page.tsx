'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCart } from '@/hooks/use-cart';
import { createOrder, getSettings } from '@/services/order.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Full name is required'),
  customerPhone: z.string().regex(/^(?:\+880|880|0)[1][3-9]\d{8}$/, 'Enter a valid Bangladesh phone number (e.g. 01712345678)'),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().min(5, 'Please enter your full delivery address'),
  district: z.string().min(1, 'District is required'),
  area: z.string().min(1, 'Area / Upazila is required'),
  orderNotes: z.string().optional(),
});

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [settings, setSettings] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<{ orderNumber: string; total: number } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { customerEmail: '', orderNotes: '' },
  });

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings({}));
  }, []);

  const deliveryCharge = Number(settings?.deliveryCharge ?? 60);
  const subtotal = cart.reduce((sum: number, item: any) => sum + ((item.price || 0) * item.quantity), 0);
  const total = subtotal + deliveryCharge;

  const onSubmit = async (values: z.infer<typeof checkoutSchema>) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await createOrder({
        ...values,
        paymentMethod: 'COD',
        items: cart.map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price,
        })),
      });
      clearCart();
      setOrderPlaced({ orderNumber: res.data.orderNumber, total: res.data.totalAmount });
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Unable to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-full bg-[#0B5D45]/10 flex items-center justify-center">
            <span className="text-[#0B5D45] font-bold text-2xl">&#10003;</span>
          </div>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-[#111] mb-4">Order Confirmed</h2>
        <p className="text-[#111]/60 mb-2">Thank you for your order.</p>
        <p className="text-[#111]/60 mb-8">
          Order Number: <span className="font-bold text-[#111]">{orderPlaced.orderNumber}</span>
        </p>
        <div className="flex justify-center mb-8">
          <span className="font-bold text-[#111]">Total payable: ৳{orderPlaced.total.toLocaleString()}</span>
        </div>
        <p className="text-sm text-[#111]/60 mb-10">
          We will contact you on your phone number to confirm the delivery.
        </p>
        <Button onClick={() => router.push('/')} className="w-full py-3">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <nav className="mb-8 text-xs text-[#111]/50">
        <Link href="/" className="hover:text-[#111]">Home</Link>
        <span className="mx-1 text-[#111]/30">/</span>
        <Link href="/cart" className="hover:text-[#111]">Cart</Link>
        <span className="mx-1 text-[#111]/30">/</span>
        <span className="text-[#111] font-medium">Checkout</span>
      </nav>

      <h2 className="text-3xl font-black tracking-tight text-[#111] mb-10 uppercase">Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:col-span-2">
          <div className="space-y-4">
            <p className="font-black uppercase tracking-tighter text-[10px] text-[#111] mb-2">Customer Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input {...register('customerName')} placeholder="e.g. Rahim Ahmed" />
                {errors.customerName && <span className="text-xs text-[#111]/50">{errors.customerName.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>Phone number</Label>
                <Input {...register('customerPhone')} placeholder="01712345678" />
                {errors.customerPhone && <span className="text-xs text-[#111]/50">{errors.customerPhone.message}</span>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input {...register('customerEmail')} type="email" placeholder="you@example.com" />
              {errors.customerEmail && <span className="text-xs text-[#111]/50">{errors.customerEmail.message}</span>}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="font-black uppercase tracking-tighter text-[10px] text-[#111] mb-2">Delivery Address</p>
            <div className="space-y-2">
              <Label>Full address</Label>
              <Input {...register('address')} placeholder="House, Road, Area" />
              {errors.address && <span className="text-xs text-[#111]/50">{errors.address.message}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>District</Label>
                <Input {...register('district')} placeholder="Dhaka" />
                {errors.district && <span className="text-xs text-[#111]/50">{errors.district.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>Area / Upazila</Label>
                <Input {...register('area')} placeholder="Gulshan" />
                {errors.area && <span className="text-xs text-[#111]/50">{errors.area.message}</span>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Order notes (optional)</Label>
            <Textarea {...register('orderNotes')} rows={3} placeholder="Any delivery instructions?" />
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="font-black uppercase tracking-tighter text-[10px] text-[#111] mb-2">Payment Method</p>
            <div className="flex items-center gap-3 p-3 border rounded-md bg-[#F5F2E9]/30">
              <input type="radio" checked defaultChecked className="accent-[#111]" />
              <span className="text-sm text-[#111]">Cash on Delivery (COD)</span>
            </div>
            <p className="text-xs text-[#111]/60">Pay in cash when your order is delivered.</p>
          </div>

          {serverError && (
            <div className="p-4 border rounded-md bg-[#F5F2E9]/30 text-sm text-[#111]">
              {serverError}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full py-4 text-sm font-bold uppercase tracking-wider">
            {submitting ? 'Placing Order…' : 'Confirm Order'}
          </Button>
        </form>

        <div className="lg:col-span-1">
          <div className="rounded-xl border border-[#111]/10 bg-[#F5F2E9]/30 p-6 sticky top-24">
            <h3 className="font-bold text-[#111] mb-6">Order Summary</h3>
            <div className="space-y-3 mb-6">
              {cart.map((item: any) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm mb-2">
                  <span className="text-[#111]/70 line-clamp-1">{item.size} {item.color || ''} × {item.quantity}</span>
                  <span className="font-bold text-[#111]">৳{((item.price || 0) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-[#111]/60">Subtotal</span>
                <span className="font-bold text-[#111]">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#111]/60">Delivery charge</span>
                <span className="font-bold text-[#111]">৳{deliveryCharge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#111] pt-2">
                <span>Total payable</span>
                <span>৳{total.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-[#111]/60">
              Cash on Delivery. We will contact you to confirm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
