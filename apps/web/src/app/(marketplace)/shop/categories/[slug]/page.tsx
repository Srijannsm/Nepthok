"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { MobileTabBar } from "@/components/marketplace/MobileTabBar";
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

const SUB_CATEGORIES: Record<string, string[]> = {
  chargers: ["20W", "25W", "45W", "65W", "100W"],
  cases: ["Silicone", "Hard", "Flip", "Clear", "Leather"],
  cables: ["USB-C", "Lightning", "Micro-USB", "Braided"],
  earphones: ["Wired", "Wireless", "TWS", "Over-ear"],
};

function slugToLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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

interface ActiveFilters {
  priceMin: number;
  priceMax: number;
  subCategories: string[];
  cod: boolean;
  verified: boolean;
  bulkPricing: boolean;
  minRating: boolean;
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState("relevance");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  const [filters, setFilters] = useState<ActiveFilters>({
    priceMin: 0,
    priceMax: 5000,
    subCategories: [],
    cod: false,
    verified: false,
    bulkPricing: false,
    minRating: false,
  });

  // Resolve categoryId from slug
  useEffect(() => {
    publicApi
      .get<{ success: boolean; data: unknown }>("/categories")
      .then((res) => {
        const d = res.data.data;
        const arr: { id: string; slug: string }[] = Array.isArray(d)
          ? d
          : Array.isArray((d as any)?.items)
          ? (d as any).items
          : [];
        const match = arr.find((c) => c.slug === slug);
        if (match) setCategoryId(match.id);
      })
      .catch(() => {});
  }, [slug]);

  const subCats = SUB_CATEGORIES[slug] ?? ["All"];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: "1",
        pageSize: "24",
        sort,
      };
      // Use resolved categoryId when available, fall back to slug param
      if (categoryId) {
        params.categoryId = categoryId;
      } else {
        params.category = slug;
      }
      if (filters.priceMin > 0) params.priceMin = String(filters.priceMin);
      if (filters.priceMax < 5000) params.priceMax = String(filters.priceMax);
      if (filters.subCategories.length > 0) params.subCategory = filters.subCategories.join(",");

      const res = await publicApi.get<{ success: boolean; data: unknown }>("/products", { params });
      const json = res.data;
      if (json.success) {
        const d = json.data as any;
        const raw: any[] = d?.items ?? d?.data ?? [];
        setProducts(raw.map((p: any) => ({
          ...p,
          price: Number(p.price),
          comparePrice: p.comparePrice != null ? Number(p.comparePrice) : undefined,
          sellerName: p.tenant?.name ?? p.sellerName ?? "",
          sellerVerified: true,
          wholesaleTiers: p.pricingTiers ?? p.wholesaleTiers,
        })));
        setTotal(d?.total ?? 0);
      }
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [slug, categoryId, sort, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function toggleSubCategory(val: string) {
    setFilters((f) => ({
      ...f,
      subCategories: f.subCategories.includes(val)
        ? f.subCategories.filter((s) => s !== val)
        : [...f.subCategories, val],
    }));
  }

  function removeFilter(type: keyof ActiveFilters, val?: string) {
    setFilters((f) => {
      if (type === "subCategories" && val) {
        return { ...f, subCategories: f.subCategories.filter((s) => s !== val) };
      }
      if (type === "cod") return { ...f, cod: false };
      if (type === "verified") return { ...f, verified: false };
      if (type === "bulkPricing") return { ...f, bulkPricing: false };
      if (type === "minRating") return { ...f, minRating: false };
      if (type === "priceMin") return { ...f, priceMin: 0 };
      if (type === "priceMax") return { ...f, priceMax: 5000 };
      return f;
    });
  }

  const activeChips: { label: string; onRemove: () => void }[] = [
    ...filters.subCategories.map((s) => ({
      label: s,
      onRemove: () => removeFilter("subCategories", s),
    })),
    ...(filters.cod ? [{ label: "COD", onRemove: () => removeFilter("cod") }] : []),
    ...(filters.verified ? [{ label: "Verified Seller", onRemove: () => removeFilter("verified") }] : []),
    ...(filters.bulkPricing ? [{ label: "Bulk Pricing", onRemove: () => removeFilter("bulkPricing") }] : []),
    ...(filters.minRating ? [{ label: "4.0 & up", onRemove: () => removeFilter("minRating") }] : []),
    ...(filters.priceMin > 0 || filters.priceMax < 5000
      ? [
          {
            label: `Rs. ${filters.priceMin}–${filters.priceMax}`,
            onRemove: () => {
              removeFilter("priceMin");
              removeFilter("priceMax");
            },
          },
        ]
      : []),
  ];

  const categoryLabel = slugToLabel(slug);
  const priceBarWidth = Math.max(
    0,
    Math.min(100, ((filters.priceMax - filters.priceMin) / 5000) * 100)
  );
  const priceBarLeft = Math.max(0, Math.min(100, (filters.priceMin / 5000) * 100));

  const FilterPanel = (
    <div className="flex flex-col gap-6">
      {/* Price Range */}
      <div>
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Price Range
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Min</label>
            <input
              type="number"
              value={filters.priceMin}
              min={0}
              max={filters.priceMax}
              onChange={(e) => setFilters((f) => ({ ...f, priceMin: Number(e.target.value) }))}
              className="w-full h-8 border border-gray-200 rounded px-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="Rs. 0"
            />
          </div>
          <span className="text-gray-400 text-xs mt-4">–</span>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Max</label>
            <input
              type="number"
              value={filters.priceMax}
              min={filters.priceMin}
              max={99999}
              onChange={(e) => setFilters((f) => ({ ...f, priceMax: Number(e.target.value) }))}
              className="w-full h-8 border border-gray-200 rounded px-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="Rs. 5000"
            />
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-blue-500 rounded-full"
            style={{ left: `${priceBarLeft}%`, width: `${priceBarWidth}%` }}
          />
        </div>
      </div>

      {/* Sub-categories */}
      {subCats.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Sub-categories
          </h3>
          <div className="flex flex-col gap-2">
            {subCats.map((sc) => (
              <label key={sc} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.subCategories.includes(sc)}
                  onChange={() => toggleSubCategory(sc)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{sc}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Trust filters */}
      <div>
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Trust Filters
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { key: "cod" as const, label: "COD available", icon: "☞" },
            { key: "verified" as const, label: "Verified seller", icon: "✓" },
            { key: "bulkPricing" as const, label: "Bulk pricing", icon: "↺" },
            { key: "minRating" as const, label: "4.0 & up", icon: "★" },
          ].map(({ key, label, icon }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters[key] as boolean}
                onChange={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                <span className="text-gray-500 mr-1">{icon}</span>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Mobile header ── */}
      <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">{categoryLabel}</h1>
            <p className="text-xs text-gray-500">
              {loading ? "Loading…" : `${total.toLocaleString("en-IN")} items`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSortOpen(true)}
              className="flex items-center gap-1 text-xs font-medium text-gray-700 border border-gray-300 rounded-full px-3 py-1.5 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <span>⇕</span>
              <span>Sort</span>
            </button>
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="relative flex items-center gap-1 text-xs font-medium text-gray-700 border border-gray-300 rounded-full px-3 py-1.5 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <span>⏛</span>
              <span>Filter</span>
              {activeChips.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
                  {activeChips.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sub-category pill rail */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none pb-1">
          {subCats.map((sc) => (
            <button
              key={sc}
              onClick={() => toggleSubCategory(sc)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-150 ${
                filters.subCategories.includes(sc)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {sc}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 hidden lg:flex gap-6">
        {/* Sidebar */}
        <aside className="w-60 shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-5 sticky top-20">
            <h2 className="text-sm font-bold text-gray-900 mb-5">Filters</h2>
            {FilterPanel}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Category heading + controls */}
          <div className="flex items-start justify-between mb-4 gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{categoryLabel}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {loading ? "Loading…" : `${total.toLocaleString("en-IN")} items`}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
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
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={chip.onRemove}
                  className="flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {chip.label}
                  <span className="text-blue-400 ml-0.5">✕</span>
                </button>
              ))}
              {activeChips.length > 1 && (
                <button
                  onClick={() =>
                    setFilters({
                      priceMin: 0,
                      priceMax: 5000,
                      subCategories: [],
                      cod: false,
                      verified: false,
                      bulkPricing: false,
                      minRating: false,
                    })
                  }
                  className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 underline"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Product grid */}
          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-4xl mb-4">▦</span>
              <p className="text-gray-600 font-medium">No products found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile product grid ── */}
      <div className="lg:hidden px-3 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-4">▦</span>
            <p className="text-gray-600 font-medium">No products found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile filter drawer ── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="text-gray-500 hover:text-gray-900 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-5">{FilterPanel}</div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
              <button
                onClick={() => {
                  setFilters({
                    priceMin: 0,
                    priceMax: 5000,
                    subCategories: [],
                    cod: false,
                    verified: false,
                    bulkPricing: false,
                    minRating: false,
                  });
                }}
                className="flex-1 h-10 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile sort sheet ── */}
      {mobileSortOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileSortOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Sort by</h2>
              <button
                onClick={() => setMobileSortOpen(false)}
                className="text-gray-500 hover:text-gray-900 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-3 pb-8">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    setSort(o.value);
                    setMobileSortOpen(false);
                  }}
                  className={`w-full text-left py-3 px-2 text-sm border-b border-gray-50 last:border-0 flex items-center justify-between ${
                    sort === o.value ? "text-blue-600 font-medium" : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  {o.label}
                  {sort === o.value && <span className="text-blue-600">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <MobileTabBar active="shop" />
    </div>
  );
}
