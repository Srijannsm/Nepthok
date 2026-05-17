"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { publicApi } from "@/lib/api";

interface Seller {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  _count: { products: number };
}

function SellerSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-100 rounded w-3/4 mb-1.5" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-1" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  );
}

function SellerInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
  return (
    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
      {initials}
    </div>
  );
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    publicApi
      .get<{ success: boolean; data: unknown }>("/sellers")
      .then((res) => {
        const d = res.data.data as any;
        const arr: Seller[] = d?.items ?? [];
        setSellers(arr);
        setTotal(d?.total ?? arr.length);
      })
      .catch(() => setSellers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-5 lg:px-8">
        <nav className="text-xs text-gray-400 mb-1">
          <Link href="/shop" className="hover:text-blue-600">Shop</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-600">Sellers</span>
        </nav>
        <h1 className="text-xl font-bold text-gray-900">Verified Sellers</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {loading ? "Loading…" : `${total} verified seller${total !== 1 ? "s" : ""} on Nepthok`}
        </p>
      </div>

      {/* Trust strip */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-x-6 gap-y-1 text-xs text-blue-800 font-medium">
          <span>✓ All sellers verified by Nepthok</span>
          <span>⛟ COD available on all orders</span>
          <span>↩ 7-day return policy</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SellerSkeleton key={i} />
            ))}
          </div>
        ) : sellers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <span className="text-4xl text-gray-200">▦</span>
            <p className="text-gray-600 font-medium">No sellers found</p>
            <Link href="/shop" className="text-sm text-blue-600 hover:underline">Back to shop</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellers.map((seller) => (
              <div
                key={seller.id}
                className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:border-blue-300 hover:shadow-sm transition-all duration-150"
              >
                {/* Logo + name */}
                <div className="flex items-center gap-3">
                  {seller.logo ? (
                    <img
                      src={seller.logo}
                      alt={seller.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <SellerInitials name={seller.name} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{seller.name}</p>
                      <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                        ✓
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {seller._count.products} product{seller._count.products !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {seller.description && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {seller.description}
                  </p>
                )}

                {/* CTA */}
                <Link
                  href={`/shop/categories/cases?seller=${seller.slug}`}
                  className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Visit store →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
