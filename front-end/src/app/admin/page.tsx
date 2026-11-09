import { useEffect, useState } from 'react';
import { adminGetDashboard } from '@/services/order.service';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Users, Clock, CreditCard } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetDashboard()
      .then((json) => {
        setStats(json.data);
        setRecent(json.data.recentOrders || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border rounded-xl bg-[#111]/10 p-4">
            <div className="text-xs font-black uppercase">Total Orders</div>
            <div className="text-3xl font-black text-[#111]">{stats?.totalOrders ?? '--'}</div>
          </div>
          <div className="border rounded-xl bg-[#111]/10 p-4">
            <div className="text-xs font-black uppercase">Total Products</div>
            <div className="text-3xl font-black text-[#111]">{stats?.totalProducts ?? '--'}</div>
          </div>
          <div className="border rounded-xl bg-[#111]/10 p-4">
            <div className="text-xs font-black uppercase">Pending Orders</div>
            <div className="text-3xl font-black text-[#111]">{stats?.pendingOrders ?? '--'}</div>
          </div>
          <div className="border rounded-xl bg-[#111]/10 p-4">
            <div className="text-xs font-black uppercase">Completed Orders</div>
            <div className="text-3xl font-black text-[#111]">{stats?.completedOrders ?? '--'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#111] mb-1">Dashboard</h1>
          <p className="text-[#111]/60 text-sm">Overview of your OOFY store.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {['Total Orders', 'Total Products', 'Pending Orders', 'Completed Orders'].map((title) => {
          const value =
            title === 'Total Orders' ? stats?.totalOrders :
            title === 'Total Products' ? stats?.totalProducts :
            title === 'Pending Orders' ? stats?.pendingOrders :
            stats?.completedOrders;
          return (
            <div key={title} className="border rounded-xl bg-[#111]/10 p-4">
              <div className="font-black text-[#111] uppercase tracking-wider text-xs mb-2">{title}</div>
              <div className="text-3xl font-black text-[#111]">{value ?? '--'}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#111]/10 bg-[#F5F2E9]/30">
        <div className="px-6 py-4">
          <div className="font-black text-[#111] uppercase tracking-tight text-sm">Recent Orders</div>
        </div>
        <Separator />
        <div className="p-0">
          <div className="overflow-x-auto">
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
                {(recent || []).map((order: any) => (
                  <tr key={order.id} className="border-b border-[#111]/10 last:border-0">
                    <td className="px-6 py-4 text-sm font-medium text-[#111]">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-[#111]">{order.customerName}</td>
                    <td className="px-6 py-4 text-sm text-[#111]/60">{order.customerPhone}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[#111]">৳{Number(order.totalAmount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                        order.status === 'DELIVERED'
                          ? 'bg-[#0B5D45]/10 text-[#0B5D45] border-[#0B5D45]/30'
                          : order.status === 'CANCELLED'
                          ? 'bg-[#111]/10 text-[#111]/50 border-[#111]/20'
                          : 'bg-[#111]/10 text-[#111] border-[#111]/30'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#111]/60">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!recent || recent.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-[#111]/50 text-sm">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
