"use client";

import { useState, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart.store";

interface MarketplaceHeaderProps {
  trackingOrderNumber?: string;
  showSearch?: boolean;
}

export function MarketplaceHeader({
  trackingOrderNumber,
  showSearch = true,
}: MarketplaceHeaderProps) {
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems());
  const [lang, setLang] = useState<"EN" | "NE">("EN");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchRef.current?.value.trim();
    if (q) router.push(`/shop/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      {/* Desktop header */}
      <div className="hidden lg:flex items-center gap-4 px-6 h-14">
        {/* Logo */}
        <Link href="/shop" className="flex items-center gap-0.5 shrink-0 mr-2">
          <span className="font-bold text-xl tracking-tight text-gray-900">nepthok</span>
          <span className="text-blue-600 font-bold text-2xl leading-none">.</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 text-sm font-medium text-gray-600">
          <Link href="/shop" className="px-3 py-1.5 rounded hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150">
            Shop
          </Link>
          <Link href="/shop/categories" className="px-3 py-1.5 rounded hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150">
            Categories
          </Link>
          <Link href="/shop/sellers" className="px-3 py-1.5 rounded hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150">
            Sellers
          </Link>
        </nav>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-2">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-400 pointer-events-none">⌕</span>
            <input
              ref={searchRef}
              type="search"
              placeholder="Search cases, chargers, cables…"
              className="w-full h-9 pl-9 pr-4 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150"
            />
          </div>
        </form>

        {/* Right side controls */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {/* Tracking pill */}
          {trackingOrderNumber && (
            <Link
              href={`/shop/track?order=${trackingOrderNumber}`}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors duration-150"
            >
              <span>⌖</span>
              <span>Track #{trackingOrderNumber}</span>
            </Link>
          )}

          {/* Language toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === "EN" ? "NE" : "EN")}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 transition-colors duration-150"
          >
            {lang === "EN" ? "नेपाली" : "EN"}
          </button>

          {/* Hotline */}
          <a
            href="tel:015550000"
            className="hidden xl:flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors duration-150"
          >
            <span>☏</span>
            <span className="font-mono">01-555-NEPT</span>
          </a>

          {/* Cart */}
          <Link
            href="/shop/cart"
            className="relative flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
          >
            <span>🛒</span>
            <span>Cart</span>
            {totalItems > 0 && (
              <span className="ml-0.5 bg-white text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile header */}
      <div className="flex lg:hidden items-center gap-3 px-4 h-12">
        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-600 text-xl leading-none p-1"
          aria-label="Menu"
        >
          ≡
        </button>

        {/* Logo */}
        <Link href="/shop" className="flex items-center gap-0 flex-1 justify-center">
          <span className="font-bold text-lg tracking-tight text-gray-900">nepthok</span>
          <span className="text-blue-600 font-bold text-xl leading-none">.</span>
        </Link>

        {/* Right: lang + cart */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === "EN" ? "NE" : "EN")}
            className="text-xs font-medium text-gray-600 px-1.5 py-0.5 border border-gray-200 rounded"
          >
            {lang === "EN" ? "ने" : "EN"}
          </button>
          <Link href="/shop/cart" className="relative text-gray-700 text-xl leading-none p-1">
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="lg:hidden px-4 pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400 pointer-events-none text-sm">⌕</span>
              <input
                ref={searchRef}
                type="search"
                placeholder="Search cases, chargers, cables…"
                className="w-full h-9 pl-9 pr-4 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-150"
              />
            </div>
          </form>
        </div>
      )}

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-gray-700 py-2 px-3 rounded hover:bg-gray-50"
          >
            Shop
          </Link>
          <Link
            href="/shop/categories"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-gray-700 py-2 px-3 rounded hover:bg-gray-50"
          >
            Categories
          </Link>
          <Link
            href="/shop/sellers"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-gray-700 py-2 px-3 rounded hover:bg-gray-50"
          >
            Sellers
          </Link>
          {trackingOrderNumber && (
            <Link
              href={`/shop/track?order=${trackingOrderNumber}`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-sm text-blue-600 py-2 px-3 rounded hover:bg-blue-50"
            >
              <span>⌖</span>
              <span>Track #{trackingOrderNumber}</span>
            </Link>
          )}
          <a
            href="tel:015550000"
            className="flex items-center gap-1.5 text-sm text-gray-500 py-2 px-3"
          >
            <span>☏</span>
            <span className="font-mono">01-555-NEPT</span>
          </a>
        </div>
      )}
    </header>
  );
}
