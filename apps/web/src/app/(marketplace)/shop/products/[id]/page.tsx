"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Stars } from "@/components/marketplace/Stars";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { QuantityStepper } from "@/components/marketplace/QuantityStepper";
import { WholesalePricing } from "@/components/marketplace/WholesalePricing";
import { useCartStore } from "@/store/cart.store";
import { publicApi } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface PriceTier {
  minQty: number;
  price: number;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stock?: number;
  images?: string[];
  seller: {
    tenantId: string;
    name: string;
    slug: string;
    verified?: boolean;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  priceTiers?: PriceTier[];
  soldCount?: number;
  rating?: number;
  ratingCount?: number;
  warranty?: string;
}

interface RelatedProduct {
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
  wholesaleTiers?: PriceTier[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function discountPct(original: number, current: number) {
  return Math.round(((original - current) / original) * 100);
}

function maxBulkSaving(tiers: PriceTier[], basePrice: number) {
  if (!tiers.length) return 0;
  const lowestTierPrice = tiers[tiers.length - 1].price;
  return Math.round(((basePrice - lowestTierPrice) / basePrice) * 100);
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Seller banner skeleton */}
      <div className="bg-white border-b border-dashed border-gray-200 px-4 py-3 lg:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 bg-gray-200 rounded w-40" />
            <div className="h-3 bg-gray-200 rounded w-64" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6 grid lg:grid-cols-[1.2fr_1fr] gap-8">
        <div className="flex flex-col gap-4">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-gray-200 rounded-lg" />
            <div className="flex-1 h-12 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg transition-all duration-200 lg:bottom-6 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      {message}
    </div>
  );
}

// ── Bulk pricing table ─────────────────────────────────────────────────────

function BulkPricingTable({
  tiers,
  basePrice,
  currentQty,
}: {
  tiers: PriceTier[];
  basePrice: number;
  currentQty: number;
}) {
  if (!tiers || tiers.length === 0) return null;

  const saving = maxBulkSaving(tiers, basePrice);

  // Build row ranges (e.g. 1–9, 10–49, 50+)
  const rows = tiers.map((tier, idx) => {
    const next = tiers[idx + 1];
    const rangeLabel = next ? `${tier.minQty}–${next.minQty - 1} pcs` : `${tier.minQty}+ pcs`;
    const isActive = currentQty >= tier.minQty && (!next || currentQty < next.minQty);
    return { tier, rangeLabel, isActive };
  });

  // Add a "1 pc" row at the start representing base price if first tier requires >1
  const firstTierMin = tiers[0].minQty;
  const baseRow =
    firstTierMin > 1
      ? { tier: { minQty: 1, price: basePrice }, rangeLabel: `1–${firstTierMin - 1} pcs`, isActive: currentQty < firstTierMin }
      : null;

  const allRows = baseRow ? [baseRow, ...rows] : rows;

  return (
    <div className="border border-orange-200 rounded-lg overflow-hidden bg-orange-50">
      <div className="px-3 py-2 bg-orange-100 border-b border-orange-200">
        <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">
          Bulk Pricing · save up to {saving}%
        </p>
      </div>
      <div className="divide-y divide-orange-100">
        {allRows.map((row) => (
          <div
            key={row.tier.minQty}
            className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
              row.isActive
                ? "bg-orange-200/60 font-semibold text-orange-900"
                : "text-gray-700"
            }`}
          >
            <span className="font-mono text-xs">{row.rangeLabel}</span>
            <span className="font-mono font-medium">{formatPrice(row.tier.price)} / pc</span>
            {row.isActive && (
              <span className="text-xs font-bold text-orange-600 ml-2">← current</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [currentPricePerUnit, setCurrentPricePerUnit] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const addItem = useCartStore((s) => s.addItem);

  // ── Fetch product ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    publicApi
      .get<{ success: boolean; data: ProductDetail; message?: string }>(`/products/${id}`)
      .then((res) => {
        if (!res.data.success) throw new Error(res.data.message || "Failed to load");
        const p = res.data.data;
        setProduct(p);
        setCurrentPricePerUnit(p.price);
      })
      .catch((err: Error) => {
        setError(err.message ?? "Product not found");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Fetch related products ───────────────────────────────────────────────
  useEffect(() => {
    if (!product?.seller?.tenantId) return;
    publicApi
      .get<{ success: boolean; data: unknown }>("/products", {
        params: { tenantId: product.seller.tenantId, pageSize: 4 },
      })
      .then((res) => {
        if (!res.data.success) return;
        const d = res.data.data as any;
        const arr: RelatedProduct[] = d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
        setRelatedProducts(arr.filter((p) => p.id !== id).slice(0, 3));
      })
      .catch(() => {});
  }, [product?.seller?.tenantId, id]);

  // ── Fetch per-unit price on qty change ──────────────────────────────────
  const fetchQtyPrice = useCallback(
    async (quantity: number) => {
      if (!id) return;
      try {
        const res = await publicApi.get<{ success: boolean; data: unknown }>(
          `/products/${id}/price`,
          { params: { quantity } }
        );
        if (!res.data.success) return;
        const d = res.data.data as any;
        if (typeof d?.price === "number") {
          setCurrentPricePerUnit(d.price);
        } else if (typeof d === "number") {
          setCurrentPricePerUnit(d);
        }
      } catch {
        // fall back to priceTiers client-side
      }
    },
    [id]
  );

  useEffect(() => {
    if (!product) return;
    // If the product has priceTiers, do a server lookup; otherwise use base price
    if (product.priceTiers && product.priceTiers.length > 0) {
      fetchQtyPrice(qty);
    } else {
      setCurrentPricePerUnit(product.price);
    }
  }, [qty, product, fetchQtyPrice]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }

  // ── Add to cart ──────────────────────────────────────────────────────────
  function handleAddToCart() {
    if (!product) return;
    addItem({
      productId: product.id,
      tenantId: product.seller.tenantId,
      productName: product.name,
      sellerName: product.seller.name,
      price: currentPricePerUnit ?? product.price,
      qty,
      imageUrl: product.images?.[0],
    });
    showToast("Added to cart");
  }

  // ── Save / wishlist ──────────────────────────────────────────────────────
  function handleSave() {
    setSaved((v) => !v);
    showToast(saved ? "Removed from saved" : "Saved");
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) return <ProductSkeleton />;

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <span className="text-5xl">▦</span>
        <h1 className="text-xl font-bold text-gray-800">Product not found</h1>
        <p className="text-sm text-gray-500">{error ?? "This product may have been removed."}</p>
        <Link
          href="/shop"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to shop
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const heroImage = images[selectedImage] ?? null;
  const tiers = product.priceTiers ?? [];
  const effectivePrice = currentPricePerUnit ?? product.price;
  const showRating =
    typeof product.rating === "number" &&
    typeof product.ratingCount === "number" &&
    product.ratingCount >= 5;

  // ── Seller banner content ─────────────────────────────────────────────────
  const initials = getInitials(product.seller.name);

  return (
    <>
      <Toast message={toastMsg} visible={toastVisible} />

      <div className="min-h-screen bg-gray-50">
        {/* ── Seller Banner ─────────────────────────────────────────────── */}
        <div className="bg-white border-b border-dashed border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 lg:px-6 flex items-center gap-3">
            {/* Avatar */}
            <div className="shrink-0 w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm lg:text-base select-none">
              {initials}
            </div>

            {/* Seller info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm lg:text-base truncate">
                  {product.seller.name}
                </span>
                {product.seller.verified !== false && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full shrink-0">
                    ✓ verified seller
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                ★ 4.8 · 432 reviews · ships from Lalitpur · responds in 2h avg
              </p>
            </div>

            {/* CTA buttons */}
            <div className="shrink-0 flex items-center gap-2">
              {/* Mobile: visit store pill only */}
              <Link
                href={`/shop/store/${product.seller.slug}`}
                className="lg:hidden text-xs font-medium text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors"
              >
                Visit store
              </Link>
              {/* Desktop: visit store + follow */}
              <Link
                href={`/shop/store/${product.seller.slug}`}
                className="hidden lg:inline-flex items-center text-sm font-medium text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Visit store
              </Link>
              <button className="hidden lg:inline-flex items-center text-sm font-medium text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                + Follow
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile breadcrumb ─────────────────────────────────────────── */}
        <div className="lg:hidden bg-white px-4 py-2 text-xs text-gray-500 flex items-center gap-1 border-b border-gray-100">
          <Link href="/shop" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/shop/categories/${product.category.slug}`} className="hover:text-blue-600 transition-colors truncate max-w-[100px]">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-700 truncate max-w-[120px] font-medium">{product.name}</span>
        </div>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-8 lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-10">

          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {/* Hero image */}
            <div className="relative aspect-square w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt={product.name}
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-6xl">
                  ▦
                </div>
              )}
            </div>

            {/* Thumbnail row */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.slice(0, 5).map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-lg border-2 overflow-hidden bg-white transition-colors ${
                      selectedImage === idx
                        ? "border-blue-500"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={src}
                        alt={`${product.name} view ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Other items from this seller — desktop only */}
            {relatedProducts.length > 0 && (
              <div className="hidden lg:block mt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Other items from this seller
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {relatedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 mt-4 lg:mt-0">
            {/* Desktop breadcrumb */}
            <nav className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500">
              <Link href="/shop" className="hover:text-blue-600 transition-colors">Home</Link>
              <span>/</span>
              <Link href={`/shop/categories/${product.category.slug}`} className="hover:text-blue-600 transition-colors">
                {product.category.name}
              </Link>
              <span>/</span>
              <span className="text-gray-700 font-medium truncate">{product.name}</span>
            </nav>

            {/* Product title */}
            <h1 className="text-xl font-bold text-gray-900 leading-snug lg:text-2xl">
              {product.name}
            </h1>

            {/* Stars */}
            {showRating && (
              <Stars value={product.rating!} count={product.ratingCount!} size="md" />
            )}

            {/* Price row */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold font-mono text-gray-900 lg:text-3xl">
                {formatPrice(effectivePrice)}
              </span>
              {product.originalPrice && product.originalPrice > effectivePrice && (
                <>
                  <span className="text-sm font-mono text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="text-sm font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    -{discountPct(product.originalPrice, effectivePrice)}%
                  </span>
                </>
              )}
            </div>

            {/* Bulk pricing table */}
            {tiers.length > 0 && (
              <BulkPricingTable tiers={tiers} basePrice={product.price} currentQty={qty} />
            )}

            {/* Quantity stepper */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quantity
              </label>
              <QuantityStepper
                value={qty}
                onChange={setQty}
                min={1}
                max={product.stock ?? undefined}
                size="md"
              />
              {product.stock !== undefined && product.stock <= 10 && product.stock > 0 && (
                <span className="text-xs font-medium text-orange-600">
                  Only {product.stock} left
                </span>
              )}
              {product.stock === 0 && (
                <span className="text-xs font-medium text-red-600">Out of stock</span>
              )}
            </div>

            {/* WholesalePricing reactive component */}
            {tiers.length > 0 && (
              <WholesalePricing tiers={tiers} currentQty={qty} basePrice={product.price} />
            )}

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                ⛟ COD available
              </span>
              {typeof product.soldCount === "number" && product.soldCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  {product.soldCount.toLocaleString("en-IN")} sold
                </span>
              )}
              {product.warranty && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                  ✓ {product.warranty}
                </span>
              )}
            </div>

            {/* Save + Add to cart buttons — desktop */}
            <div className="hidden lg:flex gap-3">
              <button
                onClick={handleSave}
                className={`flex-1 h-12 rounded-lg border text-sm font-semibold transition-colors duration-150 flex items-center justify-center gap-2 ${
                  saved
                    ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{saved ? "♥" : "♡"}</span>
                <span>{saved ? "Saved" : "Save"}</span>
              </button>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <span>+</span>
                <span>Add to cart · {formatPrice(effectivePrice * qty)}</span>
              </button>
            </div>

            {/* Info box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-600 leading-relaxed hidden lg:block">
              ⛟ Free delivery KTM Valley above Rs. 1,500 &nbsp;·&nbsp; ⤴ 7-day return &nbsp;·&nbsp; ☏ 01-555-NEPT
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile: seller line, info, trust pills below images ───────── */}
        <div className="lg:hidden px-4 pb-2">
          {/* Mobile trust pills + info */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
              ⛟ COD available
            </span>
            {typeof product.soldCount === "number" && product.soldCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                {product.soldCount.toLocaleString("en-IN")} sold
              </span>
            )}
            {product.warranty && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                ✓ {product.warranty}
              </span>
            )}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500">
            ⛟ Free delivery KTM Valley above Rs. 1,500 · ⤴ 7-day return · ☏ 01-555-NEPT
          </div>
        </div>

        {/* ── Mobile: other items from seller ──────────────────────────── */}
        {relatedProducts.length > 0 && (
          <div className="lg:hidden px-4 pb-24">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Other items from this seller
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile sticky bottom bar ──────────────────────────────────────── */}
      <div className="fixed bottom-14 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 px-4 py-2 flex gap-3">
        <button
          onClick={handleSave}
          className={`flex items-center justify-center w-12 h-11 rounded-lg border text-lg transition-colors shrink-0 ${
            saved
              ? "bg-red-50 border-red-200 text-red-500"
              : "bg-white border-gray-300 text-gray-400 hover:text-red-400"
          }`}
          aria-label="Save product"
        >
          {saved ? "♥" : "♡"}
        </button>
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors duration-150 flex items-center justify-center gap-1.5"
        >
          <span>Add to cart</span>
          <span className="font-mono">· {formatPrice(effectivePrice * qty)}</span>
        </button>
      </div>
    </>
  );
}
