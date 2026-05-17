"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { publicApi } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface StatusEvent {
  status: string;
  note?: string;
  createdAt: string;
}

interface TrackedOrder {
  orderNumber: string;
  status: string;
  buyerName: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory: StatusEvent[];
}

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:    { label: "Pending",    color: "text-gray-600",  bg: "bg-gray-100",  icon: "⏳" },
  CONFIRMED:  { label: "Confirmed",  color: "text-blue-600",  bg: "bg-blue-50",   icon: "✓" },
  PROCESSING: { label: "Processing", color: "text-amber-600", bg: "bg-amber-50",  icon: "⚙" },
  SHIPPED:    { label: "Shipped",    color: "text-indigo-600",bg: "bg-indigo-50", icon: "⛟" },
  DELIVERED:  { label: "Delivered",  color: "text-green-600", bg: "bg-green-50",  icon: "✓✓" },
  CANCELLED:  { label: "Cancelled",  color: "text-red-600",   bg: "bg-red-50",    icon: "✕" },
  REFUNDED:   { label: "Refunded",   color: "text-orange-600",bg: "bg-orange-50", icon: "↩" },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "text-gray-600", bg: "bg-gray-100", icon: "?" };
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${meta.bg} ${meta.color}`}>
      <span className="text-base leading-none">{meta.icon}</span>
      {meta.label}
    </span>
  );
}

function formatNPR(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Inner component (uses useSearchParams) ─────────────────────────────────

function TrackForm() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;
    setLoading(true);
    setOrder(null);
    setError(null);
    try {
      const res = await publicApi.get<{ success: boolean; data: TrackedOrder }>("/orders/track", {
        params: { orderNumber: orderNumber.trim(), email: email.trim() },
      });
      setOrder(res.data.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Order not found. Check the order number and email address.";
      setError(Array.isArray(msg) ? msg.join(" ") : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 lg:px-6">
      {/* Search form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Enter your order details</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Order number
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. NPT-20240517-XXXX"
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150 font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email used during checkout"
              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors duration-150"
          >
            {loading ? "Searching…" : "Track order"}
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-red-500 text-lg leading-none mt-0.5">✕</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Order result */}
      {order && (
        <div className="flex flex-col gap-4">
          {/* Status card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 font-mono mb-0.5">#{order.orderNumber}</p>
                <p className="font-semibold text-gray-900">{order.buyerName}</p>
                <p className="text-xs text-gray-400 mt-0.5">Placed {formatDate(order.createdAt)}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Order items */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Items ordered</p>
              <div className="flex flex-col gap-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-700">{item.productName}</span>
                    <span className="text-gray-400 shrink-0">×{item.quantity}</span>
                    <span className="text-gray-900 font-medium shrink-0">{formatNPR(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status timeline */}
          {order.statusHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Status history</p>
              <div className="flex flex-col gap-0">
                {order.statusHistory.map((event, i) => {
                  const meta = STATUS_META[event.status] ?? { label: event.status, color: "text-gray-600", bg: "bg-gray-100", icon: "?" };
                  const isFirst = i === 0;
                  return (
                    <div key={i} className="flex gap-4">
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isFirst ? meta.bg + " " + meta.color : "bg-gray-100 text-gray-400"}`}>
                          {meta.icon}
                        </div>
                        {i < order.statusHistory.length - 1 && (
                          <div className="w-px flex-1 bg-gray-200 my-1" />
                        )}
                      </div>
                      {/* Event info */}
                      <div className="pb-5 flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isFirst ? meta.color : "text-gray-500"}`}>
                          {meta.label}
                        </p>
                        {event.note && (
                          <p className="text-xs text-gray-400 mt-0.5">{event.note}</p>
                        )}
                        <p className="text-xs text-gray-300 mt-0.5 font-mono">{formatDate(event.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Help note */}
          <p className="text-xs text-center text-gray-400">
            Need help?{" "}
            <a href="tel:015550000" className="text-blue-600 hover:underline font-mono">
              ☏ 01-555-NEPT
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TrackPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-5 lg:px-8">
        <nav className="text-xs text-gray-400 mb-1">
          <Link href="/shop" className="hover:text-blue-600">Shop</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-600">Track order</span>
        </nav>
        <h1 className="text-xl font-bold text-gray-900">Track your order</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enter your order number and email to see the current status</p>
      </div>

      <Suspense fallback={<div className="flex justify-center py-16 text-sm text-gray-400">Loading…</div>}>
        <TrackForm />
      </Suspense>

    </div>
  );
}
