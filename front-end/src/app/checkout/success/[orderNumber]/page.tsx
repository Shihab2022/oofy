import { trackOrder } from '@/services/order.service';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Order Confirmation | OOFY',
};

export default async function OrderSuccessPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  let order: any = null;
  try {
    const json = await trackOrder(params.orderNumber);
    order = json.data;
  } catch {}
  if (!order) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="flex justify-center mb-8">
        <div className="h-16 w-16 rounded-full bg-[#0B5D45]/10 flex items-center justify-center">
          <span className="text-[#0B5D45] font-bold text-2xl">✓</span>
        </div>
      </div>
      <h2 className="text-3xl font-black tracking-tight text-[#111] mb-2">Order Confirmed</h2>
      <p className="text-[#111]/60 mb-10">
        Order Number: <span className="font-bold text-[#111]">{order.orderNumber}</span>
      </p>

      <div className="rounded-xl border border-[#111]/10 bg-[#F5F2E9]/30 p-8">
        <h3 className="font-bold text-[#111] mb-6">Order Summary</h3>
        <div className="space-y-4 mb-8">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex justify-between items-baseline text-sm">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#111]">{item.product?.name || 'Product'}</span>
                <span className="text-[#111]/60 text-xs">
                  Size {item.size}{item.color ? ` · {item.color}` : ''}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[#111]/60 text-xs">× {item.quantity}</span>
                <div className="font-bold text-[#111]">৳{(Number(item.price) * item.quantity).toLocaleString()}</div>
              </div>
            </div>
          ))}
          <div className="border-t border-[#111]/20 pt-4 mt-4 flex justify-between text-base font-bold text-[#111]">
            <span>Total paid</span>
            <span>৳{Number(order.totalAmount).toLocaleString()}</span></div>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="px-2 py-1 rounded border border-[#0B5D45]/30 text-[#0B5D45] text-[10px] font-bold uppercase">
            {order.paymentMethod}
          </span>
          <span className="px-2 py-1 rounded border border-[#111]/20 text-[#111] text-[10px] font-bold uppercase">
            {order.status}
          </span>
        </div>
        <p className="mt-6 text-xs text-[#111]/60">
          We will contact you at {order.customerPhone} to confirm your delivery.
        </p>
      </div>
    </div>
  );
}