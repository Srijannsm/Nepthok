"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart.store";
import { QuantityStepper } from "./QuantityStepper";
import { useRouter } from "next/navigation";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const panelRef = useRef<HTMLDivElement>(null);

  const itemList = Object.entries(items);
  const itemCount = itemList.reduce((sum, [, item]) => sum + item.qty, 0);

  // Trap focus / close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-xl transition-transform duration-200 w-[92%] max-w-sm ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            Your cart{" "}
            <span className="text-gray-500 font-normal text-sm">({itemCount})</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none p-1 transition-colors duration-150"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
          {itemList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 py-16">
              <span className="text-4xl">🛒</span>
              <p className="text-sm">Your cart is empty</p>
              <Link
                href="/shop"
                onClick={onClose}
                className="text-blue-600 text-sm hover:underline mt-1"
              >
                Browse products
              </Link>
            </div>
          ) : (
            itemList.map(([key, item]) => (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex gap-3 items-start">
                  {/* Image */}
                  <div className="relative w-16 h-16 bg-gray-100 rounded shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xl">
                        ▦
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">{item.sellerName}</p>
                    <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                      {item.productName}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 gap-2">
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
                  </div>
                </div>

                {/* Wholesale upsell hint */}
                {item.qty > 0 && item.qty < 10 && (
                  <p className="text-xs text-gray-400 pl-[76px]">
                    ↓ Order 10+ to unlock bulk pricing
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {itemList.length > 0 && (
          <div className="shrink-0 border-t border-gray-200 px-4 py-4 flex flex-col gap-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-mono font-semibold text-gray-900">{formatPrice(totalPrice)}</span>
            </div>

            {/* Checkout button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/shop/checkout");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <span>Checkout →</span>
              <span className="font-mono">{formatPrice(totalPrice)}</span>
            </button>

            {/* View full cart */}
            <Link
              href="/shop/cart"
              onClick={onClose}
              className="text-center text-sm text-blue-600 hover:underline"
            >
              View full cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
