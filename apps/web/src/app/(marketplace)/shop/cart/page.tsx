"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore, type CartItem } from "@/store/cart.store";
import { QuantityStepper } from "@/components/marketplace/QuantityStepper";

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

// Group items by tenantId → { [tenantId]: { sellerName, items: [key, CartItem][] } }
function groupBySeller(items: Record<string, CartItem>) {
  const groups: Record<
    string,
    { sellerName: string; entries: [string, CartItem][] }
  > = {};

  for (const [key, item] of Object.entries(items)) {
    if (!groups[item.tenantId]) {
      groups[item.tenantId] = { sellerName: item.sellerName, entries: [] };
    }
    groups[item.tenantId].entries.push([key, item]);
  }

  return groups;
}

// Wholesale upsell threshold — show hint when qty is within 7 of 10
const WHOLESALE_THRESHOLD = 10;
const WHOLESALE_PRICE_PCT = 0.85; // 15% discount illustration

function WholesaleHint({ item }: { item: CartItem }) {
  const remaining = WHOLESALE_THRESHOLD - item.qty;
  if (remaining <= 0 || remaining > 7) return null;
  const bulkPrice = Math.floor(item.price * WHOLESALE_PRICE_PCT);
  return (
    <p className="text-xs text-blue-600 mt-1">
      Add {remaining} more → {formatPrice(bulkPrice)} / pc
    </p>
  );
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const initCart = useCartStore((s) => s.initCart);
  const hydrated = useCartStore((s) => s.hydrated);

  const [discountCode, setDiscountCode] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (!hydrated) initCart();
  }, [hydrated, initCart]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function handleApplyDiscount() {
    showToast("Invalid or expired code");
  }

  if (!hydrated) {
    // Skeleton while hydrating
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Loading cart…</p>
      </div>
    );
  }

  const itemEntries = Object.entries(items);
  const totalItems = itemEntries.reduce((sum, [, i]) => sum + i.qty, 0);
  const subtotal = itemEntries.reduce((sum, [, i]) => sum + i.price * i.qty, 0);
  const delivery = subtotal >= 1500 ? 0 : 100;
  const discount = 0;
  const total = subtotal + delivery - discount;

  const groups = groupBySeller(items);
  const groupEntries = Object.entries(groups);

  // ── Empty state ────────────────────────────────────────────────────
  if (itemEntries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-5xl">🛒</span>
        <h1 className="text-xl font-semibold text-gray-900">
          Your cart is empty
        </h1>
        <p className="text-gray-500 text-sm max-w-xs">
          Looks like you haven&apos;t added anything yet. Browse our products to
          get started.
        </p>
        <Link
          href="/shop"
          className="mt-2 inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors duration-150"
        >
          Continue shopping →
        </Link>
      </div>
    );
  }

  // ── Filled cart ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg pointer-events-none transition-opacity duration-200">
          {toastMsg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
        {/* Page heading — visible both breakpoints */}
        <h1 className="text-xl font-bold text-gray-900 mb-5 lg:mb-8 lg:text-2xl">
          Your cart{" "}
          <span className="font-normal text-gray-500 text-base">
            ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>
        </h1>

        {/* 2-column grid on desktop; stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 lg:gap-8 items-start">
          {/* ── LEFT: Cart items ────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* Seller groups */}
            {groupEntries.map(([tenantId, group]) => (
              <div
                key={tenantId}
                className="border border-gray-200 rounded-lg bg-white overflow-hidden"
              >
                {/* Group header */}
                <div className="px-4 pt-3 pb-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <span className="text-green-600 mr-1">✓</span>
                    SELLER {group.sellerName}
                    <span className="text-gray-400 font-normal normal-case ml-1">
                      · ships from Kathmandu
                    </span>
                  </p>
                </div>

                {/* Dashed separator */}
                <div className="border-t border-dashed border-gray-200 mx-4" />

                {/* Items */}
                <div className="flex flex-col divide-y divide-gray-100">
                  {group.entries.map(([key, item]) => (
                    <div key={key} className="px-4 py-3">
                      <div className="flex gap-3 items-start">
                        {/* Image — 80px desktop, 50px mobile */}
                        <div className="relative shrink-0 overflow-hidden rounded bg-gray-100 w-[50px] h-[50px] lg:w-[80px] lg:h-[80px]">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 50px, 80px"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xl">
                              ▦
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                            {item.productName}
                          </p>

                          {/* Qty stepper + line total */}
                          <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                            <QuantityStepper
                              value={item.qty}
                              onChange={(n) => updateQty(key, n)}
                              min={1}
                              size="sm"
                            />
                            <span className="font-mono text-sm font-semibold text-gray-900 shrink-0">
                              {formatPrice(item.price * item.qty)}
                            </span>
                          </div>

                          {/* Remove link */}
                          <button
                            type="button"
                            onClick={() => removeItem(key)}
                            className="mt-1.5 text-xs text-red-500 hover:text-red-700 hover:underline transition-colors duration-150"
                          >
                            Remove
                          </button>

                          {/* Wholesale upsell hint */}
                          <WholesaleHint item={item} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Multi-seller shipping notice */}
            <p className="text-xs text-gray-500 flex items-start gap-1.5 px-1">
              <span className="text-base leading-none shrink-0">⛟</span>
              <span>
                Multi-seller orders ship in separate packages. No extra cost on
                Nepthok.
              </span>
            </p>

            {/* Discount code — mobile only (inline with items) */}
            <div className="lg:hidden flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700">
                Discount code
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors duration-150 shrink-0"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Mobile summary box */}
            <div className="lg:hidden border border-gray-200 rounded-lg bg-white p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Subtotal · {totalItems} items</span>
                <span className="font-mono font-medium text-gray-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Delivery (KTM Valley)</span>
                <span className="font-mono font-medium text-gray-900">
                  {delivery === 0 ? (
                    <span className="text-green-600">Free!</span>
                  ) : (
                    formatPrice(delivery)
                  )}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm text-green-700">
                  <span>Discount</span>
                  <span className="font-mono font-medium">
                    − {formatPrice(discount)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  Total
                </span>
                <span className="font-mono text-lg font-bold text-gray-900">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sticky order summary (desktop) ───────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-6 border border-gray-200 rounded-lg bg-white p-5 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-gray-900">
                Order summary
              </h2>

              {/* Line items */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Subtotal · {totalItems} items</span>
                  <span className="font-mono font-medium text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Delivery (KTM Valley)</span>
                  <span className="font-mono font-medium text-gray-900">
                    {delivery === 0 ? (
                      <span className="text-green-600">Free!</span>
                    ) : (
                      formatPrice(delivery)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Discount</span>
                  <span className="font-mono font-medium text-gray-900">
                    − {formatPrice(discount)}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    Total
                  </span>
                  <span
                    className="font-mono text-xl font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
                  >
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Discount code input */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-gray-700">
                  Discount code
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-150"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors duration-150 shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Checkout button */}
              <Link
                href="/shop/checkout"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
              >
                Checkout →
              </Link>

              {/* Continue shopping */}
              <Link
                href="/shop"
                className="text-center text-sm text-blue-600 hover:underline"
              >
                or continue shopping
              </Link>

              {/* Trust box */}
              <div className="border-t border-gray-100 pt-3 flex flex-col gap-1.5 text-xs text-gray-500">
                <p className="flex items-center gap-1.5">
                  <span>⛟</span>
                  <span>Free delivery KTM Valley above Rs. 1,500</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span>⤴</span>
                  <span>7-day return</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>No account needed</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile fixed bottom bar ────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-gray-200 bg-white px-4 py-3 pb-safe">
        <Link
          href="/shop/checkout"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
        >
          <span>Checkout ·</span>
          <span className="font-mono">{formatPrice(total)}</span>
        </Link>
      </div>
    </div>
  );
}
