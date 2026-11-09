'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendContactMessage } from '@/services/order.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(6, 'Phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: z.infer<typeof contactSchema>) => {
    setSubmitting(true);
    try {
      await sendContactMessage(values);
      setStatus('sent');
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {status === 'sent' ? (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-[#0B5D45]/10 flex items-center justify-center">
              <span className="text-[#0B5D45] font-bold text-2xl">✓</span>
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[#111] mb-4">Message Sent</h2>
          <p className="text-[#111]/60 mb-8">We will get back to you soon.</p>
          <Button onClick={() => setStatus('idle')} className="w-full py-3">
            Send another message
          </Button>
        </div>
      ) : (
        <>
          <span className="text-[#0B5D45] font-black uppercase tracking-[0.3em] text-xs mb-4 block">Contact Us</span>
          <h2 className="text-4xl font-black tracking-tight text-[#111] mb-6">Get in Touch</h2>
          <p className="text-[#111]/60 mb-10">
            Have a question about an order, sizing, or wholesale? Drop us a line.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input {...register('name')} placeholder="Rahim Ahmed" />
                {errors.name && <span className="text-xs text-[#111]/50">{errors.name.message}</span>}
              </div>
              <div className="space-y-2">
                <Label>Phone number</Label>
                <Input {...register('phone')} placeholder="01712345678" />
                {errors.phone && <span className="text-xs text-[#111]/50">{errors.phone.message}</span>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email address</Label>
              <Input {...register('email')} type="email" placeholder="you@example.com" />
              {errors.email && <span className="text-xs text-[#111]/50">{errors.email.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea {...register('message')} rows={5} placeholder="How can we help you?" />
              {errors.message && <span className="text-xs text-[#111]/50">{errors.message.message}</span>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full py-3 text-sm font-bold uppercase tracking-wider">
              {submitting ? 'Sending…' : 'Send Message'}
            </Button>
          </form>

          <div className="mt-16 border-t border-[#111]/10 pt-12">
            <h3 className="font-bold text-[#111] mb-6">Other ways to reach us</h3>
            <div className="space-y-4 text-sm text-[#111]/70">
              <p>Email: <a href="mailto:oofybrand@gmail.com" className="text-[#0B5D45] underline">oofybrand@gmail.com</a></p>
              <p>Bangladesh — Cash on Delivery available nationwide</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}