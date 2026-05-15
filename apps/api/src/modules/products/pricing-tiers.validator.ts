export function validatePricingTiers(tiers: unknown[]): string | null {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;

  if (tiers.length < 2) return "Pricing tiers must have at least 2 tiers";

  const t = tiers as Array<{ minQty: number; maxQty: number | null; price: number }>;

  if (t[0].minQty !== 1) return "First tier must start at quantity 1";

  if (t.length > 1 && t[1].minQty < 10)
    return "Wholesale tier minimum quantity cannot be less than 10";

  if (t[t.length - 1].maxQty !== null)
    return "Last tier must have no upper limit (maxQty: null)";

  for (let i = 1; i < t.length; i++) {
    if (t[i].price >= t[i - 1].price)
      return "Each tier price must be lower than the previous tier";

    if (t[i].minQty !== (t[i - 1].maxQty as number) + 1)
      return "Tiers must be contiguous with no gaps or overlaps";
  }

  return null;
}
