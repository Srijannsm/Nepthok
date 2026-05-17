"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { publicApi } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  cases: "📱",
  chargers: "⚡",
  cables: "🔌",
  earphones: "🎧",
  powerbanks: "🔋",
  "screen-protectors": "🛡️",
  accessories: "🎒",
};

function defaultIcon(name: string) {
  return name.charAt(0).toUpperCase();
}

function CategorySkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse flex flex-col items-center gap-3">
      <div className="w-14 h-14 bg-gray-100 rounded-full" />
      <div className="h-4 bg-gray-100 rounded w-24" />
      <div className="h-3 bg-gray-100 rounded w-32" />
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi
      .get<{ success: boolean; data: unknown }>("/categories")
      .then((res) => {
        const d = res.data.data;
        const arr: Category[] = Array.isArray(d)
          ? d
          : Array.isArray((d as any)?.items)
          ? (d as any).items
          : [];
        setCategories(arr);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-5 lg:px-8">
        <nav className="text-xs text-gray-400 mb-1">
          <Link href="/shop" className="hover:text-blue-600">Shop</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-600">Categories</span>
        </nav>
        <h1 className="text-xl font-bold text-gray-900">Browse by Category</h1>
        <p className="text-sm text-gray-500 mt-0.5">Find what you need from Nepal&apos;s top mobile accessory sellers</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <span className="text-4xl text-gray-200">▦</span>
            <p className="text-gray-600 font-medium">No categories found</p>
            <Link href="/shop" className="text-sm text-blue-600 hover:underline">Back to shop</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const icon = CATEGORY_ICONS[cat.slug];
              return (
                <Link
                  key={cat.id}
                  href={`/shop/categories/${cat.slug}`}
                  className="group bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center gap-3 hover:border-blue-400 hover:shadow-sm transition-all duration-150"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-2xl group-hover:bg-blue-100 transition-colors duration-150">
                    {icon ?? (
                      <span className="text-blue-600 font-bold text-xl">
                        {defaultIcon(cat.name)}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-150">
                      {cat.name}
                    </p>
                    {cat.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{cat.description}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    Shop now →
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* All products link */}
        {!loading && categories.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors duration-150"
            >
              ▦ Browse all products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
