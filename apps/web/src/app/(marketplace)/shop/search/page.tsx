"use client";

import { useEffect, useState, useCallback, useRef, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { MobileTabBar } from "@/components/marketplace/MobileTabBar";
import { useCartStore } from "@/store/cart.store";
import { publicApi } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  sellerName: string;
  sellerVerified?: boolean;
  price: number;
  originalPrice?: number;
  discountPct?: number;
  soldCount?: number;
  rating?: number;
  ratingCount?: number;
  imageUrl?: string;
  inStock?: boolean;
  wholesaleTiers?: { minQty: number; price: number }[];
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
];

const SUB_CATEGORY_PILLS = [
  "All",
  "Cases",
  "Chargers",
  "Cables",
  "Earphones",
  "Power Banks",
  "Screen Guards",
  "Stands",
];

function ProductSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      <div className="bg-gray-200 aspect-square w-full" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") ?? "";

  const totalItems = useCartStore((s) => s.totalItems());

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("relevance");
  const [activeSubCat, setActiveSubCat] = useState("All");

  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async (q: string, sortVal: string) => {
    if (!q.trim()) {
      setProducts([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const res = await publicApi.get<{ success: boolean; data: unknown }>("/products", {
        params: { search: q, page: 1, pageSize: 24, sort: sortVal },
      });
      const json = res.data;
      if (json.success) {
        const d = json.data as any;
        setProducts(d?.items ?? d?.data ?? []);
        setTotal(d?.total ?? 0);
      }
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(query, sort);
  }, [query, sort, fetchProducts]);

  // Sync desktop search input with query param
  useEffect(() => {
    if (desktopSearchRef.current) desktopSearchRef.current.value = query;
    if (mobileSearchRef.current) mobileSearchRef.current.value = query;
  }, [query]);

  function handleDesktopSearch(e: FormEvent) {
    e.preventDefault();
    const q = desktopSearchRef.current?.value.trim();
    if (q) {
      router.push(`/shop/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/shop");
    }
  }

  function handleMobileSearch(e: FormEvent) {
    e.preventDefault();
    const q = mobileSearchRef.current?.value.trim();
    if (q) {
      router.push(`/shop/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/shop");
    }
  }

  function clearSearch() {
    router.push("/shop");
  }

  const ProductGrid = ({ cols }: { cols: 2 | 4 }) => {
    const gridClass = cols === 4 ? "grid-cols-4" : "grid-cols-2";
    const gap = cols === 4 ? "gap-4" : "gap-3";
    if (loading) {
      return (
        <div className={`grid ${gridClass} ${gap}`}>
          {Array.from({ length: cols === 4 ? 8 : 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      );
    }
    if (products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">⌕</span>
          <p className="text-gray-600 font-medium">
            {query ? `No results for "${query}"` : "Search for products above"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Try different keywords or browse by category
          </p>
        </div>
      );
    }
    return (
      <div className={`grid ${gridClass} ${gap}`}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Desktop layout ── */}
      <div className="hidden lg:block">
        {/* Compact search header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
            {/* Logo */}
            <Link href="/shop" className="flex items-center gap-0 shrink-0 mr-2">
              <span className="font-bold text-xl tracking-tight text-gray-900">nepthok</span>
              <span className="text-blue-600 font-bold text-2xl leading-none">.</span>
            </Link>

            {/* Active search bar */}
            <form onSubmit={handleDesktopSearch} className="flex-1 max-w-xl">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 pointer-events-none">⌕</span>
                <input
                  ref={desktopSearchRef}
                  type="search"
                  defaultValue={query}
                  placeholder="Search cases, chargers, cables…"
                  className="w-full h-9 pl-9 pr-9 border-2 border-blue-500 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-150 bg-white"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2.5 text-gray-400 hover:text-gray-700 text-sm leading-none"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </form>

            {/* Cart */}
            <Link
              href="/shop/cart"
              className="relative flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150 ml-auto shrink-0"
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

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Results row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              {query && (
                <p className="text-sm text-gray-700">
                  {loading
                    ? "Searching…"
                    : `${total.toLocaleString("en-IN")} results for `}
                  {!loading && (
                    <span className="font-semibold text-gray-900">&ldquo;{query}&rdquo;</span>
                  )}
                </p>
              )}
              {/* Did you mean — hardcoded for MVP */}
              {!loading && query && total === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Did you mean{" "}
                  <Link
                    href={`/shop/search?q=${encodeURIComponent(query + "s")}`}
                    className="text-blue-600 underline"
                  >
                    {query}s
                  </Link>
                  ?
                </p>
              )}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-category pill rail */}
          <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none pb-1">
            {SUB_CATEGORY_PILLS.map((pill) => (
              <button
                key={pill}
                onClick={() => setActiveSubCat(pill)}
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-150 ${
                  activeSubCat === pill
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          <ProductGrid cols={4} />
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="lg:hidden">
        {/* Mobile search header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Back arrow */}
            <button
              onClick={() => router.back()}
              className="text-gray-600 text-xl leading-none p-1 shrink-0"
              aria-label="Go back"
            >
              ←
            </button>

            {/* Active search input */}
            <form onSubmit={handleMobileSearch} className="flex-1">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 pointer-events-none text-sm">⌕</span>
                <input
                  ref={mobileSearchRef}
                  type="search"
                  defaultValue={query}
                  placeholder="Search cases, chargers…"
                  className="w-full h-9 pl-9 pr-8 border-2 border-blue-500 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-150 bg-white"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2.5 text-gray-400 hover:text-gray-700 text-sm leading-none"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Item count row */}
        <div className="bg-white border-b border-gray-100 px-4 py-2">
          <p className="text-xs text-gray-500">
            {loading
              ? "Searching…"
              : query
              ? `${total.toLocaleString("en-IN")} results for "${query}"`
              : "Search for products above"}
          </p>
        </div>

        {/* Sub-category pill rail */}
        <div className="bg-white border-b border-gray-100 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {SUB_CATEGORY_PILLS.map((pill) => (
              <button
                key={pill}
                onClick={() => setActiveSubCat(pill)}
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-150 ${
                  activeSubCat === pill
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* 2-col product grid */}
        <div className="px-3 py-4">
          <ProductGrid cols={2} />
        </div>

        {/* "Can't find it?" call box */}
        <div className="mx-3 mb-6 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-blue-500 text-lg shrink-0">☏</span>
          <div>
            <p className="text-xs font-semibold text-blue-800">Can&apos;t find it?</p>
            <a href="tel:015550000" className="text-xs text-blue-600 font-mono hover:underline">
              Call 01-555-NEPT
            </a>
          </div>
        </div>
      </div>

      <MobileTabBar active="search" />
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}
