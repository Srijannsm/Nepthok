"use client";

interface WholesaleTier {
  minQty: number;
  price: number;
}

interface WholesalePricingProps {
  tiers: WholesaleTier[];
  currentQty: number;
  basePrice: number;
}

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

export function WholesalePricing({ tiers, currentQty, basePrice }: WholesalePricingProps) {
  if (!tiers || tiers.length === 0) return null;

  // Find active tier (highest threshold that currentQty meets)
  const activeTierIndex = tiers.reduce((acc, tier, idx) => {
    if (currentQty >= tier.minQty) return idx;
    return acc;
  }, -1);

  const activeTier = activeTierIndex >= 0 ? tiers[activeTierIndex] : null;
  const nextTier =
    activeTierIndex >= 0
      ? tiers[activeTierIndex + 1] ?? null
      : tiers[0];

  // State: unlocked
  if (activeTier) {
    const saving = (basePrice - activeTier.price) * currentQty;
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 transition-colors duration-[120ms]">
        <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
          <span className="text-green-600">✓</span>
          <span>Bulk price unlocked — saving {formatPrice(saving)}</span>
        </div>
        {nextTier && (
          <p className="text-xs text-green-600 mt-1 ml-5">
            Next tier: {nextTier.minQty}+ pcs → {formatPrice(nextTier.price)} / pc
          </p>
        )}
      </div>
    );
  }

  // nextTier is tiers[0] when nothing is unlocked
  const threshold = nextTier!.minQty;
  const pct = currentQty / threshold; // 0..1
  const approaching = pct >= 0.75;

  // State: approaching threshold
  if (approaching) {
    const remaining = threshold - currentQty;
    const barPct = Math.round(pct * 100);
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 transition-colors duration-[120ms]">
        <p className="text-sm text-blue-800 font-medium">
          {remaining} more to unlock {formatPrice(nextTier!.price)} / pc
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-colors duration-[120ms]"
              style={{ width: `${barPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-blue-600 whitespace-nowrap">
            {currentQty}/{threshold}
          </span>
        </div>
      </div>
    );
  }

  // State: below threshold, not approaching
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 transition-colors duration-[120ms]">
      <p className="text-sm text-gray-600">
        <span className="text-gray-400 mr-1">↓</span>
        Order {threshold}+ pcs and pay {formatPrice(nextTier!.price)} each.
      </p>
    </div>
  );
}
