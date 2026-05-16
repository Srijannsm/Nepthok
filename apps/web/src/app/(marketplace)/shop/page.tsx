"use client";

import { useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const POPULAR_SEARCHES = [
  "iPhone 15 case",
  "fast charger",
  "Samsung S24",
  "60W cable",
  "airpods cover",
  "power bank 10000",
];

const PHONE_BRANDS_MOBILE = [
  { label: "iPhone", query: "iPhone" },
  { label: "Samsung", query: "Samsung" },
  { label: "Xiaomi", query: "Xiaomi" },
  { label: "OnePlus", query: "OnePlus" },
];

const PHONE_MODELS_DESKTOP = [
  { label: "iPhone 15", query: "iPhone 15" },
  { label: "iPhone 14", query: "iPhone 14" },
  { label: "iPhone 13", query: "iPhone 13" },
  { label: "Samsung S24", query: "Samsung S24" },
  { label: "Samsung A55", query: "Samsung A55" },
  { label: "Xiaomi 14", query: "Xiaomi 14" },
  { label: "Redmi 13", query: "Redmi 13" },
  { label: "OnePlus 12", query: "OnePlus 12" },
];

// Skeleton card for trending now
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="bg-gray-100 aspect-square w-full" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

export default function ShopHomePage() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchRef.current?.value.trim();
    if (q) router.push(`/shop/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero / Search Section ──────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-10 lg:py-16 flex flex-col items-center text-center gap-5">
          {/* Headline */}
          <h1 className="text-2xl font-bold text-gray-900 leading-snug lg:text-4xl lg:leading-tight">
            What does your phone
            <br />
            need today?
          </h1>

          {/* Subtitle — desktop only */}
          <p className="hidden lg:block text-base text-gray-500 -mt-2">
            Search 1,200+ accessories from verified Nepali sellers.
          </p>

          {/* Search input */}
          <form onSubmit={handleSearch} className="w-full max-w-lg">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-blue-500 text-lg pointer-events-none select-none">
                ⌕
              </span>
              <input
                ref={searchRef}
                type="search"
                placeholder="iPhone 15 case…"
                className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-blue-600 text-gray-900 text-sm lg:text-base placeholder-gray-400 outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-150 bg-white shadow-sm"
                autoComplete="off"
              />
              <button
                type="submit"
                className="absolute right-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors duration-150"
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular searches */}
          <div className="flex flex-col items-center gap-2 w-full max-w-lg">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              popular searches
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_SEARCHES.map((term) => (
                <Link
                  key={term}
                  href={`/shop/search?q=${encodeURIComponent(term)}`}
                  className="text-xs text-gray-600 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 px-3 py-1.5 rounded-full border border-transparent hover:border-blue-200 transition-colors duration-150 font-medium"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop by Phone ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-8 lg:py-10">
        <h2 className="text-base font-semibold text-gray-900 mb-4 lg:text-lg">
          shop your phone
        </h2>

        {/* Mobile: 2-col grid of brand cards */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {PHONE_BRANDS_MOBILE.map((brand) => (
            <Link
              key={brand.label}
              href={`/shop/search?q=${encodeURIComponent(brand.query)}`}
              className="flex items-center justify-center bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all duration-150 py-5 px-4 font-semibold text-gray-800 text-sm hover:text-blue-700"
            >
              {brand.label}
            </Link>
          ))}
        </div>

        {/* Desktop: 8-col grid of model cards */}
        <div className="hidden lg:grid grid-cols-4 xl:grid-cols-8 gap-3">
          {PHONE_MODELS_DESKTOP.map((model) => (
            <Link
              key={model.label}
              href={`/shop/search?q=${encodeURIComponent(model.query)}`}
              className="flex items-center justify-center bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all duration-150 py-4 px-2 font-medium text-gray-800 text-sm text-center hover:text-blue-700"
            >
              {model.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Trending Now ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-10 lg:pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 lg:text-lg">
            trending now
          </h2>
          <Link
            href="/shop/search?sort=trending"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            See all
          </Link>
        </div>

        {/* 2-col skeleton grid — MVP placeholder */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Products loading soon — browse by phone above or search to find exactly what you need.
        </p>
      </section>
    </div>
  );
}
