"use client";

import Link from "next/link";
import { format } from "date-fns";
import { BookOpen, Download, FileText, MapPin } from "lucide-react";
import type { UserOrderDetail } from "@/app/types/order";
import { OrderStatusPill } from "./OrderStatusPill";

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 bg-white rounded-2xl border-2 border-[#914A8C]/20 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-[#914A8C]">
        {icon}
        <h2 className="font-bold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function OrderDetailCards({ order }: { order: UserOrderDetail }) {
  const { shipping, comic } = order;
  const cover = comic.coverThumbnailUrls?.[0];

  const addressLines = [
    shipping.line1,
    shipping.line2,
    [shipping.city, shipping.state].filter(Boolean).join(", "),
    [shipping.zip, shipping.country].filter(Boolean).join(" "),
  ].filter(Boolean);

  const pdfExpired = order.pdfDownloadExpiry
    ? new Date(order.pdfDownloadExpiry) < new Date()
    : false;

  const awaitingSelection = order.publicStatus.code === "AWAITING_SELECTION";

  return (
    <div className="space-y-6">
      <Card title="Your order" icon={<BookOpen className="w-4 h-4" />}>
        <div className="flex gap-5">
          <div className="w-20 shrink-0 rounded-lg overflow-hidden bg-[#F8E7D2] border border-[#914A8C]/10 aspect-3/4">
            {cover ? (
              <img src={cover} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{comic.title}</h3>
              <OrderStatusPill status={order.publicStatus} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Total paid</dt>
                <dd className="font-bold text-gray-900">
                  {order.currency} {order.amount}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Cover</dt>
                <dd className="font-semibold text-gray-900 capitalize">
                  {order.coverType.toLowerCase()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Ordered on</dt>
                <dd className="font-semibold text-gray-900">
                  {format(new Date(order.createdAt), "d MMM yyyy")}
                </dd>
              </div>
              {order.courierName && (
                <div>
                  <dt className="text-gray-500">Courier</dt>
                  <dd className="font-semibold text-gray-900">{order.courierName}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </Card>

      <Card title="Delivery address" icon={<MapPin className="w-4 h-4" />}>
        {shipping.name || addressLines.length ? (
          <div className="text-sm text-gray-600 space-y-1">
            {shipping.name && (
              <p className="font-bold text-gray-900 text-base">{shipping.name}</p>
            )}
            {addressLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            {shipping.phone && <p className="pt-1 text-gray-500">{shipping.phone}</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No delivery address on this order.</p>
        )}
      </Card>

      <Card title="Your book as a PDF" icon={<FileText className="w-4 h-4" />}>
        {/* Checked FIRST, above the PDF branches. An order awaiting selection
            has no PDF and never will until the customer sends it to print, and
            the generic "we're still putting your book together" message below
            is actively wrong here — nothing is happening on our side. This is
            the only place in the dashboard that tells them so. */}
        {awaitingSelection ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Almost there — your pages are ready and waiting for you to send
              them to print.
            </p>
            <Link
              href={`/personalize/${order.sessionId}/preview`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#914A8C] hover:bg-[#7a3e75] text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
            >
              <BookOpen size={16} />
              Finish your book
            </Link>
          </div>
        ) : order.pdfDownloadUrl && !pdfExpired ? (
          <div className="space-y-2">
            <a
              href={order.pdfDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#914A8C] hover:bg-[#7a3e75] text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
            >
              <Download size={16} />
              Download PDF
            </a>
            {order.pdfDownloadExpiry && (
              <p className="text-xs text-gray-400">
                Available until {format(new Date(order.pdfDownloadExpiry), "d MMM yyyy")}
              </p>
            )}
          </div>
        ) : pdfExpired ? (
          <p className="text-sm text-gray-500">
            This download link has expired. Get in touch and we&apos;ll send you a fresh one.
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            We&apos;re still putting your book together — the PDF will appear here once it&apos;s
            ready.
          </p>
        )}
      </Card>
    </div>
  );
}
