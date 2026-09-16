"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { PackageSearch } from "lucide-react";
import type { AdminOrderRow } from "@/app/types/order";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrderListTable({ orders }: { orders: AdminOrderRow[] }) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 p-12 text-center flex flex-col items-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#F8E7D2] flex items-center justify-center mb-4">
          <PackageSearch className="w-8 h-8 text-[#914A8C]" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">No orders found</h3>
        <p className="text-neutral-500 max-w-md">
          Nothing matches these filters. Try clearing the search or picking a different status.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#914A8C]/5 text-[#914A8C] font-semibold border-b border-[#914A8C]/10 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-4 rounded-tl-3xl">Order</th>
              <th className="px-6 py-4 hidden md:table-cell">Customer</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 hidden lg:table-cell">Shipment</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 hidden sm:table-cell rounded-tr-3xl">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => router.push(`/admin/orders/${order.id}`)}
                className="hover:bg-white/60 transition-colors cursor-pointer"
              >
                <td className="px-6 py-3">
                  <div className="font-bold text-neutral-900 truncate max-w-[220px]">
                    {order.comicTitle}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {order.childName ? `for ${order.childName} · ` : ""}
                    <span className="font-mono">{order.id.slice(0, 8)}</span>
                  </div>
                </td>
                <td className="px-6 py-3 hidden md:table-cell">
                  <div className="font-semibold text-neutral-900 truncate max-w-[180px]">
                    {order.customerName ?? "—"}
                  </div>
                  <div className="text-xs text-neutral-500 truncate max-w-[180px]">
                    {order.customerEmail ?? order.customerPhone ?? "—"}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-6 py-3 hidden lg:table-cell">
                  {order.awbNumber ? (
                    <div>
                      <div className="font-mono text-xs font-semibold text-neutral-900">
                        {order.awbNumber}
                      </div>
                      <div className="text-xs text-neutral-500 truncate max-w-[150px]">
                        {order.courierName ?? "—"}
                      </div>
                    </div>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right whitespace-nowrap font-semibold text-neutral-900">
                  {order.currency} {order.amount}
                </td>
                <td className="px-6 py-3 hidden sm:table-cell whitespace-nowrap text-xs text-neutral-500">
                  {format(new Date(order.createdAt), "MMM d, yyyy")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
