// Shared utility functions for Nepthok
import { PricingTier } from "@nepthok/types";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCurrency(
  amount: number,
  currency: string = "NPR"
): string {
  return new Intl.NumberFormat("ne-NP", {
    style: "currency",
    currency,
  }).format(amount);
}

export function generateId(prefix?: string): string {
  const id = Math.random().toString(36).substring(2, 11);
  return prefix ? `${prefix}_${id}` : id;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((k) => delete result[k]);
  return result;
}

export function calculatePrice(
  product: { price: number; pricingTiers?: unknown },
  quantity: number
): { unitPrice: number; total: number; tierApplied: boolean } {
  if (
    !product.pricingTiers ||
    !Array.isArray(product.pricingTiers) ||
    product.pricingTiers.length === 0
  ) {
    return {
      unitPrice: product.price,
      total: product.price * quantity,
      tierApplied: false,
    };
  }

  const tiers = product.pricingTiers as PricingTier[];
  const matchedTier = tiers.find(
    (tier) =>
      quantity >= tier.minQty &&
      (tier.maxQty === null || quantity <= tier.maxQty)
  );

  if (!matchedTier) {
    return {
      unitPrice: product.price,
      total: product.price * quantity,
      tierApplied: false,
    };
  }

  return {
    unitPrice: matchedTier.price,
    total: matchedTier.price * quantity,
    tierApplied: true,
  };
}
