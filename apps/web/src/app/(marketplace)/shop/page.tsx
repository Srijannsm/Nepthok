"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { publicApi } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MarketplaceProduct {
  id: string;
  name: string;
  sellerName: string;
  sellerVerified?: boolean;
  price: number;
  comparePrice?: number;
  originalPrice?: number;
  discountPct?: number;
  soldCount?: number;
  rating?: number;
  ratingCount?: number;
  imageUrl?: string;
  images?: string[];
  inStock?: boolean;
  stock?: number;
  lowStockThreshold?: number;
  wholesaleTiers?: { minQty: number; price: number }[];
}

type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const PAGE_SIZE = 20;

// ── Skeletons ──────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="bg-gray-100 aspect-square w-full" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractItems(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTotal(d: any): number {
  if (typeof d?.total === "number") return d.total;
  if (typeof d?.data?.total === "number") return d.data.total;
  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProduct(raw: any): MarketplaceProduct {
  return {
    ...raw,
    price: Number(raw.price),
    comparePrice: raw.comparePrice != null ? Number(raw.comparePrice) : undefined,
    sellerName: raw.tenant?.name ?? raw.sellerName ?? "",
    sellerVerified: true,
    wholesaleTiers: raw.pricingTiers ?? raw.wholesaleTiers,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ShopHomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("newest");
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch categories once
  useEffect(() => {
    publicApi
      .get<{ success: boolean; data: unknown }>("/categories")
      .then((res) => {
        const arr = extractItems(res.data.data) as Category[];
        setCategories(arr);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  // Fetch first page whenever filter/sort changes
  const fetchProducts = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1) setLoadingProducts(true);
      else setLoadingMore(true);

      try {
        const params: Record<string, unknown> = {
          page: pageNum,
          limit: PAGE_SIZE,
          sort,
        };
        if (activeCategoryId) params.categoryId = activeCategoryId;

        const res = await publicApi.get<{ success: boolean; data: unknown }>("/products", {
          params,
        });
        const items = extractItems(res.data.data).map(normalizeProduct);
        const tot = extractTotal(res.data.data);

        setProducts((prev) => (append ? [...prev, ...items] : items));
        setTotal(tot);
      } catch {
        if (!append) setProducts([]);
      } finally {
        setLoadingProducts(false);
        setLoadingMore(false);
      }
    },
    [activeCategoryId, sort]
  );

  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    fetchProducts(next, true);
  }

  function handleCategorySelect(id: string | null) {
    setActiveCategoryId(id);
    setPage(1);
  }

  const hasMore = products.length < total;

  // Active category name for the header label
  const activeCat = categories.find((c) => c.id === activeCategoryId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Promo banner ────────────────────────────────────────────────── */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
        <span className="shrink-0 text-xs font-bold text-white bg-amber-500 px-2 py-0.5 rounded font-mono uppercase tracking-wide">
          New
        </span>
        <span className="text-sm text-amber-900 font-medium">
          Free delivery inside Kathmandu Valley on orders above Rs. 1,500 · COD available everywhere
        </span>
        <Link
          href="/shop/search?sort=newest"
          className="ml-auto shrink-0 text-xs font-semibold text-amber-700 hover:underline"
        >
          Shop now →
        </Link>
      </div>

      <div className="flex">
        {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-48 xl:w-56 shrink-0 border-r border-gray-200 bg-white min-h-screen sticky top-14">
          <div className="px-4 pt-5 pb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categories</p>
          </div>
          <nav className="flex flex-col px-2 pb-6 gap-0.5">
            {/* All */}
            <button
              onClick={() => handleCategorySelect(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100 ${
                activeCategoryId === null
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              All accessories
            </button>

            {loadingCats ? (
              <div className="flex flex-col gap-1 mt-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse mx-1" />
                ))}
              </div>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100 ${
                    activeCategoryId === cat.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))
            )}
          </nav>

          {/* Trust/info strip */}
          <div className="mt-auto px-4 py-4 border-t border-gray-100 text-xs text-gray-500 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5"><span>✓</span><span>Verified sellers only</span></div>
            <div className="flex items-center gap-1.5"><span>⛟</span><span>COD available</span></div>
            <div className="flex items-center gap-1.5"><span>↩</span><span>7-day returns</span></div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <a href="tel:015550000" className="font-mono text-xs text-blue-600 hover:underline">
                ☏ 01-555-NEPT
              </a>
            </div>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Mobile category chips */}
          <div className="lg:hidden overflow-x-auto bg-white border-b border-gray-200 px-4 py-2.5">
            <div className="flex gap-2 w-max">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-100 ${
                  activeCategoryId === null
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-100 ${
                    activeCategoryId === cat.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort + count header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200 lg:px-6">
            <p className="text-sm font-medium text-gray-800">
              {loadingProducts ? (
                <span className="inline-block w-24 h-4 bg-gray-100 rounded animate-pulse" />
              ) : (
                <>
                  <span className="font-semibold text-gray-900">{activeCat?.name ?? "All accessories"}</span>
                  <span className="text-gray-400 ml-1.5">· {total.toLocaleString("en-IN")} items</span>
                </>
              )}
            </p>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:border-blue-400 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Product grid */}
          <div className="p-4 lg:p-6">
            {loadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <span className="text-5xl text-gray-200">▦</span>
                <p className="text-base font-semibold text-gray-600">No products found</p>
                <p className="text-sm text-gray-400">
                  {activeCategoryId ? "Try a different category" : "Check back soon"}
                </p>
                {activeCategoryId && (
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className="mt-1 text-sm text-blue-600 hover:underline font-medium"
                  >
                    Show all categories
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? "Loading…" : `Load more (${total - products.length} remaining)`}
                    </button>
                  </div>
                )}

                {/* Multi-seller note at bottom */}
                {products.length > 0 && !hasMore && (
                  <p className="text-xs text-gray-400 text-center mt-8">
                    ⛟ Multi-seller orders ship in separate packages. No extra cost on Nepthok.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
