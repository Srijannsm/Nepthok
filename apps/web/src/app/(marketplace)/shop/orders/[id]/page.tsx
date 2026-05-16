"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";

const LAST_ORDER_KEY = "nepthok_last_order";

interface LastOrder {
  orderId: string;
  orderNumber: string;
  email: string;
  paymentMethod?: string;
}

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LastOrder;
        setOrder(parsed);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const isCOD = !order?.paymentMethod || order.paymentMethod === "COD";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!order) {
    // Fallback if localStorage is missing
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-5xl">📦</span>
        <h1 className="text-xl font-semibold text-gray-900">Order not found</h1>
        <p className="text-gray-500 text-sm max-w-xs">
          We couldn&apos;t find your order details. Please check your email for
          confirmation.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors duration-150"
        >
          Continue shopping →
        </Link>
      </div>
    );
  }

  return (
    <>
      <MarketplaceHeader
        showSearch={false}
        trackingOrderNumber={order.orderNumber}
      />

      <main className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-6">
          {/* ── Check circle + heading ─────────────────────────────────── */}
          <div className="flex flex-col items-center text-center gap-3">
            <div
              className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-green-600 text-2xl leading-none font-bold">
                ✓
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Order placed!</h1>
            <p className="text-sm text-gray-500">
              We&apos;ll WhatsApp &amp; email tracking updates.
            </p>
          </div>

          {/* ── Order number box ──────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center text-center gap-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Your Order Number
            </p>
            <p
              className="text-3xl font-bold text-blue-600 tracking-tight"
              style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
            >
              {order.orderNumber}
            </p>
            <p className="text-xs text-gray-400">
              Saved to this browser. Tap &lsquo;Track&rsquo; anytime.
            </p>
          </div>

          {/* ── What happens next ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              What happens next
            </h2>
            <ol className="flex flex-col gap-3">
              {[
                {
                  step: 1,
                  text: "Seller confirms order (within 24h)",
                  always: true,
                },
                {
                  step: 2,
                  text: "Packed & handed to courier",
                  always: true,
                },
                {
                  step: 3,
                  text: "Out for delivery — courier calls you",
                  always: true,
                },
                {
                  step: 4,
                  text: `Pay cash on delivery`,
                  always: false, // only shown for COD
                },
              ]
                .filter((s) => s.always || isCOD)
                .map((s) => (
                  <li key={s.step} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {s.step}
                    </span>
                    <span className="text-sm text-gray-700">{s.text}</span>
                  </li>
                ))}
            </ol>
          </div>

          {/* ── Help box ─────────────────────────────────────────────── */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
            <span className="text-blue-600 text-xl shrink-0">☏</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">Need help?</p>
              <p className="text-xs text-blue-600 mt-0.5">
                <a
                  href="tel:015550000"
                  className="font-mono hover:underline"
                >
                  01-555-NEPT
                </a>{" "}
                · 9 AM – 7 PM daily
              </p>
            </div>
          </div>

          {/* ── CTAs ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled
              className="w-full border border-gray-200 text-gray-400 text-sm font-semibold py-3 rounded-lg cursor-not-allowed bg-gray-50"
              title="Tracking timeline coming soon"
            >
              View tracking timeline
            </button>
            <Link
              href="/shop"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-150 flex items-center justify-center gap-1"
            >
              Continue shopping →
            </Link>
          </div>

          {/* ── Email reminder ────────────────────────────────────────── */}
          {order.email && (
            <p className="text-center text-xs text-gray-400">
              Confirmation sent to{" "}
              <span className="font-medium text-gray-600">{order.email}</span>
            </p>
          )}
        </div>
      </main>
    </>
  );
}
