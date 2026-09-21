"use client";

import Link from "next/link";
import { format } from "date-fns";
import { BookOpen, ChevronRight, CreditCard } from "lucide-react";
import type { UserOrderRow } from "@/app/types/order";
import { OrderStatusPill } from "./OrderStatusPill";

export function OrderCard({ order }: { order: UserOrderRow }) {
  const awaitingPayment = order.publicStatus.code === "AWAITING_PAYMENT";
  // Paid and fully generated, but the customer never sent it to print. Nothing
  // is happening on our side, so the card has to say so and hand them the way
  // back in — otherwise the order just sits there looking finished.
  const awaitingSelection = order.publicStatus.code === "AWAITING_SELECTION";
  const cover = order.comic.coverThumbnailUrls?.[0];

  return (
    <div
      className={`flex flex-col p-5 bg-white rounded-2xl border-2 shadow-sm transition-all ${
        awaitingPayment
          ? "border-amber-300"
          : awaitingSelection
            ? "border-orange-300"
            : "border-[#914A8C]/20 hover:border-[#914A8C]/40"
      }`}
    >
      <div className="flex gap-4">
        <div className="w-16 shrink-0 rounded-lg overflow-hidden bg-[#F8E7D2] border border-[#914A8C]/10 aspect-3/4">
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#914A8C]/40" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-gray-900 leading-tight">{order.comic.title}</h3>
            <OrderStatusPill status={order.publicStatus} />
          </div>

          <div className="text-sm text-gray-500">
            Ordered {format(new Date(order.createdAt), "d MMM yyyy")}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold text-gray-900">
              {order.currency} {order.amount}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500 capitalize">
              {order.coverType.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100">
        {awaitingPayment ? (
          <div className="space-y-3">
            <p className="text-sm text-amber-800 font-medium">
              This order isn&apos;t paid for yet. Finish checkout to get it printed.
            </p>
            <Link
              href={`/personalize/${order.sessionId}/checkout`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#914A8C] hover:bg-[#7a3e75] text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
            >
              <CreditCard size={16} />
              Complete payment
            </Link>
          </div>
        ) : awaitingSelection ? (
          <div className="space-y-3">
            <p className="text-sm text-orange-800 font-medium">
              Your pages are ready — finish your book to get it printed.
            </p>
            <Link
              href={`/personalize/${order.sessionId}/preview`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#914A8C] hover:bg-[#7a3e75] text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
            >
              <BookOpen size={16} />
              Finish your book
            </Link>
          </div>
        ) : (
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#914A8C] hover:text-[#7a3e75] transition-colors"
          >
            View details
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
