"use client";

import Link from "next/link";
import Image from "next/image";
import { Stars } from "./Stars";

interface WholesaleTier {
  minQty: number;
  price: number;
}

interface ProductCardProduct {
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
  wholesaleTiers?: WholesaleTier[];
}

interface ProductCardProps {
  product: ProductCardProduct;
  variant?: "grid" | "list";
}

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

export function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const {
    id,
    name,
    sellerName,
    sellerVerified,
    price,
    originalPrice,
    discountPct,
    soldCount,
    rating,
    ratingCount,
    imageUrl,
    inStock = true,
    wholesaleTiers,
  } = product;

  const showRating =
    typeof rating === "number" && typeof ratingCount === "number" && ratingCount >= 5;
  const firstTier = wholesaleTiers && wholesaleTiers.length > 0 ? wholesaleTiers[0] : null;

  const isList = variant === "list";

  return (
    <Link
      href={`/shop/products/${id}`}
      className={`group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-150 ${!inStock ? "opacity-70" : ""} ${isList ? "flex gap-3" : ""}`}
    >
      {/* Image */}
      <div
        className={`relative bg-gray-100 shrink-0 ${isList ? "w-28 h-28" : "aspect-square w-full"} ${!inStock ? "grayscale" : ""}`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-3xl">
            ▦
          </div>
        )}
        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="bg-white text-gray-600 text-xs font-medium px-2 py-0.5 rounded">
              Out of stock
            </span>
          </div>
        )}
        {/* Hover add to cart (desktop, grid only) */}
        {inStock && !isList && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-150 bg-blue-600 text-white text-xs font-medium text-center py-1.5 hidden lg:block">
            + Add to cart
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1 ${isList ? "flex-1 py-2 pr-3" : "p-3"}`}>
        {/* Seller */}
        <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
          <span className="truncate">{sellerName}</span>
          {sellerVerified && (
            <span className="text-blue-600 shrink-0" title="Verified seller">
              ✓
            </span>
          )}
        </div>

        {/* Product name */}
        <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{name}</p>

        {/* Stars */}
        {showRating && (
          <Stars value={rating!} count={ratingCount!} size="sm" />
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-mono font-bold text-gray-900 text-base">
            {formatPrice(price)}
          </span>
          {originalPrice && (
            <>
              <span className="font-mono text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
              {discountPct && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                  -{discountPct}%
                </span>
              )}
            </>
          )}
        </div>

        {/* Pills row */}
        <div className="flex flex-wrap gap-1 mt-0.5">
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-100">
            COD
          </span>
          {soldCount !== undefined && soldCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-200">
              {soldCount.toLocaleString("en-IN")} sold
            </span>
          )}
          {firstTier && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-100 font-medium">
              Bulk save
            </span>
          )}
        </div>

        {/* Wholesale hint */}
        {firstTier && (
          <p className="text-xs text-orange-600 mt-0.5">
            ↓ {formatPrice(firstTier.price)} @ {firstTier.minQty}+
          </p>
        )}
      </div>
    </Link>
  );
}
