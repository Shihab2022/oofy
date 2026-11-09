'use client';

import { useEffect, useState } from 'react';
import { getSettings, adminUpdateOrderStatus } from '@/services/order.service';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then((json) => setSettings(json.data || {})).catch(() => setSettings({}));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        storeName: settings.storeName || 'OOFY',
        storeTagline: settings.storeTagline || 'Wear Your Confidence',
        contactEmail: settings.contactEmail || 'oofybrand@gmail.com',
        deliveryCharge: Number(settings.deliveryCharge || 60),
        codEnabled: settings.codEnabled !== false,
      };
      if (settings.freeShippingThreshold) {
        payload.freeShippingThreshold = Number(settings.freeShippingThreshold);
      }
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Settings saved');
    } catch (err: any) {
      alert(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black tracking-tight text-[#111] mb-10 uppercase">Store Settings</h1>
      <div className="rounded-xl border border-[#111]/10 bg-[#F5F2E9]/30 p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#111]/70">Store name</label>
          <input
            value={settings.storeName || ''}
            onChange={(e) => setSettings((s: any) => ({ ...s, storeName: e.target.value }))}
            className="w-full h-10 rounded-md border border-[#111] bg-[#F5F2E9] px-3 text-sm outline-none focus:ring-2 focus:ring-[#111]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#111]/70">Store tagline</label>
          <input
            value={settings.storeTagline || ''}
            onChange={(e) => setSettings((s: any) => ({ ...s, storeTagline: e.target.value }))}
            className="w-full h-10 rounded-md border border-[#111] bg-[#F5F2E9] px-3 text-sm outline-none focus:ring-2 focus:ring-[#111]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#111]/70">Contact email</label>
          <input
            type="email"
            value={settings.contactEmail || ''}
            onChange={(e) => setSettings((s: any) => ({ ...s, contactEmail: e.target.value }))}
            className="w-full h-10 rounded-md border border-[#111] bg-[#F5F2E9] px-3 text-sm outline-none focus:ring-2 focus:ring-[#111]"
          />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#111]/70">Delivery charge (৳)</label>
            <input
              type="number"
              value={settings.deliveryCharge ?? ''}
              onChange={(e) => setSettings((s: any) => ({ ...s, deliveryCharge: e.target.value }))}
              className="w-full h-10 rounded-md border border-[#111] bg-[#F5F2E9] px-3 text-sm outline-none focus:ring-2 focus:ring-[#111]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#111]/70">Free shipping threshold (৳)</label>
            <input
              type="number"
              value={settings.freeShippingThreshold ?? ''}
              onChange={(e) => setSettings((s: any) => ({ ...s, freeShippingThreshold: e.target.value || undefined }))}
              className="w-full h-10 rounded-md border border-[#111] bg-[#F5F2E9] px-3 text-sm outline-none focus:ring-2 focus:ring-[#111]"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="codEnabled"
            checked={settings.codEnabled !== false}
            onChange={(e) => setSettings((s: any) => ({ ...s, codEnabled: e.target.checked }))}
            className="accent-[#111]"
          />
          <label htmlFor="codEnabled" className="text-sm font-bold text-[#111]">
            Enable Cash on Delivery
          </label>
        </div>
        <ButtonSave onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </ButtonSave>
      </div>
    </div>
  );
}

function ButtonSave({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-auto bg-[#111] text-[#F5F2E9] px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#0B5D45] transition-colors disabled:opacity-50"
    >
      {children}
    </button>
  );
}