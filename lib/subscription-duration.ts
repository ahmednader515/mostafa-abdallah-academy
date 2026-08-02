import type { SubscriptionDurationKind } from "@/lib/types";

/** القيم المخزّنة في قاعدة البيانات — ثابتة وغير قابلة للترجمة */
export const SUBSCRIPTION_DURATION_KINDS: readonly SubscriptionDurationKind[] = [
  "week",
  "month",
  "3_months",
  "6_months",
  "9_months",
  "year",
  "custom_days",
] as const;

/** توافق مع القيم القديمة months_3 / months_6 / months_9 */
const LEGACY_DURATION_KIND: Record<string, SubscriptionDurationKind> = {
  months_3: "3_months",
  months_6: "6_months",
  months_9: "9_months",
};

export function normalizeSubscriptionDurationKind(
  raw: string | null | undefined,
): SubscriptionDurationKind | null {
  if (!raw) return null;
  const v = String(raw).trim();
  if ((SUBSCRIPTION_DURATION_KINDS as readonly string[]).includes(v)) {
    return v as SubscriptionDurationKind;
  }
  return LEGACY_DURATION_KIND[v] ?? null;
}

export function isSubscriptionDurationKind(raw: string): raw is SubscriptionDurationKind {
  return normalizeSubscriptionDurationKind(raw) != null;
}

/** مفتاح i18n للنص المعروض — نفس المفتاح للعربية والإنجليزية */
export function subscriptionDurationMessageKey(kind: string): string {
  const k = normalizeSubscriptionDurationKind(kind);
  switch (k) {
    case "week":
      return "subscriptions.durationWeek";
    case "month":
      return "subscriptions.durationMonth";
    case "3_months":
      return "subscriptions.durationMonths3";
    case "6_months":
      return "subscriptions.durationMonths6";
    case "9_months":
      return "subscriptions.durationMonths9";
    case "year":
      return "subscriptions.durationYear";
    case "custom_days":
      return "subscriptions.durationCustomDays";
    default:
      return "subscriptions.durationMonth";
  }
}

export function subscriptionDurationLabel(
  kind: string,
  t: (key: string, fallback?: string) => string,
): string {
  const k = normalizeSubscriptionDurationKind(kind);
  const key = subscriptionDurationMessageKey(kind);
  const fallbacks: Record<SubscriptionDurationKind, string> = {
    week: "Week",
    month: "Month",
    "3_months": "3 Months",
    "6_months": "6 Months",
    "9_months": "9 Months",
    year: "Year",
    custom_days: "Custom Days",
  };
  return t(key, k ? fallbacks[k] : kind);
}

/** عدد الأيام المضافة لمدة الاشتراك */
export function subscriptionDurationDays(kind: SubscriptionDurationKind, value = 1): number {
  const n = Math.max(1, Math.floor(value) || 1);
  switch (kind) {
    case "week":
      return 7 * n;
    case "month":
      return 30 * n;
    case "3_months":
      return 90 * n;
    case "6_months":
      return 180 * n;
    case "9_months":
      return 270 * n;
    case "custom_days":
      return n;
    case "year":
      return 365 * n;
  }
}
