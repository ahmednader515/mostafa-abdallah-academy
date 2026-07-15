import type { Locale } from "@/lib/i18n/types";

export const CURRENCY_CODE = "EGP";

export function formatAmount(
  amount: number,
  locale: Locale,
  options?: { minFractionDigits?: number; maxFractionDigits?: number },
): string {
  const loc = locale === "ar" ? "ar-EG" : "en-US";
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(loc, {
    minimumFractionDigits: options?.minFractionDigits ?? 2,
    maximumFractionDigits: options?.maxFractionDigits ?? 2,
  }).format(safe);
}

export function formatMoneyParts(
  amountEgp: number,
  locale: Locale,
): { amount: string; code: string } {
  return {
    amount: formatAmount(amountEgp, locale),
    code: CURRENCY_CODE,
  };
}

export function formatMoney(amountEgp: number, locale: Locale): string {
  const { amount, code } = formatMoneyParts(amountEgp, locale);
  return `${amount} ${code}`;
}
