'use client';

import { useEffect, useState } from 'react';
import {
  adminGetOrders,
  adminUpdateOrderStatus,
} from '@/services/order.service';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ status: '', search: '', page: '1' });

  useEffect(() => {
    void load();
  }, [filter.status, filter.search, filter.page]);

  const load = async (): Promise<void> => {
    setLoading(true);
    try {
      const json = await adminGetOrders({
        status: filter.status,
        search: filter.search,
        page: filter.page,
        limit: '20',
      });
      setOrders(json.data.orders || []);
      setPagination(json.data.pagination || {});
    } catch {
      setOrders([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (id: string, status: string): Promise<void> => {
    try {
      await adminUpdateOrderStatus(id, status);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Status update failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#111] mb-1">Orders</h1>
          <p className="text-[#111]/60 text-sm">Manage customer orders.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex-1 space-y-2">
          <p className="font-black uppercase tracking-tighter text-[10px] text-[#111]">Status</p>
          <select
            value={filter.status}
            onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value, page: '1' }))}
            className="w-full h-10 rounded-md border border-[#111] bg-[#F5F2E9] px-3 text-sm outline-none focus:ring-2 focus:ring-[#111]"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-2">
          <p className="font-black uppercase tracking-tighter text-[10px] text-[#111]">Search by order number or phone</p>
          <input
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value, page: '1' }))}
            className="w-full h-10 rounded-md border border-[#111] bg-[#F5F2E9] px-3 text-sm outline-none focus:ring-2 focus:ring-[#111]"
            placeholder="e.g. OOFY-123456 or 01712345678"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#111]/10 bg-[#F5F2E9]/30 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#111]/10">
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase">Order #</th>
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase">Phone</th>
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase">Total</th>
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-[#111]/50 uppercase text-center">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id} className="border-b border-[#111]/10 last:border-0 hover:bg-[#111]/3 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-[#111]">{order.orderNumber}</td>
                <td className="px-6 py-4 text-sm text-[#111]">{order.customerName}</td>
                <td className="px-6 py-4 text-sm text-[#111]/60">{order.customerPhone}</td>
                <td className="px-6 py-4 text-sm font-bold text-[#111]">৳{Number(order.totalAmount).toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <select
                    value={order.status}
                    onChange={(e) => setStatus(order.id, e.target.value)}
                    className="h-8 rounded border border-[#111] bg-[#F5F2E9] px-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-[#111]"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-[#111]/60">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#111]/50 text-sm">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between text-sm">
          <div className="flex gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setFilter((f) => ({ ...f, page: String(p) }))}
                className={`w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center transition-colors ${String(p) === filter.page ? 'bg-[#111] text-[#F5F2E9]' : 'border border-[#111]/20 text-[#111] hover:bg-[#111]/5'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="text-[#111]/60">
            Page {filter.page} of {pagination.totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
