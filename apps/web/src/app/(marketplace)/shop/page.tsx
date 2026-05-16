"use client";

import { useRef, useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Smartphone, Zap, Shield, Headphones, Battery } from "lucide-react";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { publicApi } from "@/lib/api";

const POPULAR_SEARCHES = [
  "iPhone 15 case",
  "65W fast charger",
  "USB-C cable",
  "wireless earbuds",
  "screen protector",
  "power bank 20000",
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

// Map category slugs → lucide icon
const SLUG_ICON_MAP: Record<string, React.ElementType> = {
  cases: Smartphone,
  chargers: Zap,
  "screen-guards": Shield,
  earphones: Headphones,
  "power-banks": Battery,
};

function getCategoryIcon(slug: string): React.ElementType {
  if (SLUG_ICON_MAP[slug]) return SLUG_ICON_MAP[slug];
  for (const [key, Icon] of Object.entries(SLUG_ICON_MAP)) {
    if (slug.includes(key.replace("-", ""))) return Icon;
  }
  return Smartphone;
}

const STATIC_CATEGORIES = [
  { slug: "cases", name: "Cases", Icon: Smartphone },
  { slug: "chargers", name: "Chargers", Icon: Zap },
  { slug: "screen-guards", name: "Screen Guards", Icon: Shield },
  { slug: "earphones", name: "Earphones", Icon: Headphones },
  { slug: "power-banks", name: "Power Banks", Icon: Battery },
];

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

function ProductSkeleton() {
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

function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="w-6 h-6 bg-gray-100 rounded-full" />
      <div className="h-3 bg-gray-100 rounded w-16" />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractItems(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

export default function ShopHomePage() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<MarketplaceProduct[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    publicApi
      .get<{ success: boolean; data: unknown }>("/categories")
      .then((res) => {
        const arr = extractItems(res.data.data) as Category[];
        setCategories(arr.slice(0, 5));
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));

    publicApi
      .get<{ success: boolean; data: unknown }>("/products", {
        params: { pageSize: 4, page: 1, sort: "newest" },
      })
      .then((res) => {
        const arr = extractItems(res.data.data) as MarketplaceProduct[];
        setTrendingProducts(arr.slice(0, 4));
      })
      .catch(() => setTrendingProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchRef.current?.value.trim();
    if (q) router.push(`/shop/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero / Search ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-10 lg:py-16 flex flex-col items-center text-center gap-5">
          <h1 className="text-2xl font-bold text-gray-900 leading-snug lg:text-4xl lg:leading-tight">
            Nepal&apos;s #1 mobile
            <br />
            accessories marketplace
          </h1>

          <p className="hidden lg:block text-base text-gray-500 -mt-2">
            Cases, chargers, cables &amp; more — from verified sellers across Nepal.
          </p>

          <form onSubmit={handleSearch} className="w-full max-w-lg">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-blue-500 text-lg pointer-events-none select-none">
                ⌕
              </span>
              <input
                ref={searchRef}
                type="search"
                placeholder="Search iPhone cases, chargers, cables…"
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
              popular
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

      {/* ── Browse by category ── */}
      <section className="max-w-5xl mx-auto px-4 py-8 lg:py-10">
        <h2 className="text-base font-semibold text-gray-900 mb-4 lg:text-lg">
          browse by category
        </h2>

        {loadingCats ? (
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.slug);
              return (
                <Link
                  key={cat.id}
                  href={`/shop/categories/${cat.slug}`}
                  className="flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all duration-150 py-5 px-2 text-center group"
                >
                  <Icon className="w-6 h-6 text-blue-600 group-hover:text-blue-700" />
                  <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
            {STATIC_CATEGORIES.map(({ slug, name, Icon }) => (
              <Link
                key={slug}
                href={`/shop/categories/${slug}`}
                className="flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all duration-150 py-5 px-2 text-center group"
              >
                <Icon className="w-6 h-6 text-blue-600 group-hover:text-blue-700" />
                <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                  {name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Shop by phone ── */}
      <section className="max-w-5xl mx-auto px-4 pb-8 lg:pb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-4 lg:text-lg">
          shop by phone
        </h2>

        {/* Mobile: 2-col brand grid */}
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

        {/* Desktop: 8-col model grid */}
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

      {/* ── Trending now ── */}
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

        {loadingProducts ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : trendingProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {trendingProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              Browse by phone or search to find exactly what you need.
            </p>
          </>
        )}
      </section>

      {/* ── How it works ── */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-base font-semibold text-gray-900 mb-6 lg:text-lg text-center">
            how it works
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Search & browse", desc: "Find accessories for any phone model" },
              { step: "2", title: "Add to cart", desc: "From verified Nepali sellers" },
              { step: "3", title: "Checkout", desc: "COD, eSewa, or Khalti" },
              { step: "4", title: "Door delivery", desc: "Free delivery above Rs. 1,500" },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center gap-2">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {s.step}
                </div>
                <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <footer className="bg-gray-900 text-gray-400 text-xs text-center py-4 px-4">
        Nepal&apos;s trusted marketplace for mobile accessories. Verified sellers. Fast delivery. COD available.
      </footer>
    </div>
  );
}
