/** يحل السعر الفعلي وعناصر عرض الخصم لباقة اشتراك (آمن للعميل والخادم) */
export function resolveSubscriptionPlanPricing(plan: {
  price: number;
  discountPrice?: number | null;
  discountPercent?: number | null;
}): {
  chargePrice: number;
  compareAtPrice: number | null;
  discountPercent: number | null;
  savingsAmount: number | null;
  hasDiscount: boolean;
} {
  const base = Math.max(0, Number(plan.price) || 0);
  let sale: number | null =
    plan.discountPrice != null && Number.isFinite(Number(plan.discountPrice))
      ? Math.max(0, Number(plan.discountPrice))
      : null;
  const pctRaw =
    plan.discountPercent != null && Number.isFinite(Number(plan.discountPercent))
      ? Math.max(0, Math.min(100, Number(plan.discountPercent)))
      : null;

  if (sale == null && pctRaw != null && pctRaw > 0 && base > 0) {
    sale = Math.round(base * (1 - pctRaw / 100) * 100) / 100;
  }

  const hasDiscount = sale != null && sale < base;
  if (!hasDiscount) {
    return {
      chargePrice: base,
      compareAtPrice: null,
      discountPercent: null,
      savingsAmount: null,
      hasDiscount: false,
    };
  }

  const chargePrice = sale as number;
  const savingsAmount = Math.round((base - chargePrice) * 100) / 100;
  let discountPercent = pctRaw != null && pctRaw > 0 ? pctRaw : null;
  if (discountPercent == null && base > 0) {
    discountPercent = Math.round(((base - chargePrice) / base) * 1000) / 10;
  }

  return {
    chargePrice,
    compareAtPrice: base,
    discountPercent,
    savingsAmount,
    hasDiscount: true,
  };
}
