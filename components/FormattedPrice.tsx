"use client";

import { useCurrency } from "./CurrencyProvider";

type FormattedPriceProps = {
  amountEgp: number;
  className?: string;
  /** Split badge: amount + currency code (CourseCard style) */
  variant?: "inline" | "badge";
};

export function FormattedPrice({ amountEgp, className, variant = "inline" }: FormattedPriceProps) {
  const { formatPriceParts } = useCurrency();
  const { amount, code } = formatPriceParts(amountEgp);

  if (variant === "badge") {
    return (
      <span
        className={
          className ??
          "inline-flex items-stretch overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
        }
        dir="ltr"
      >
        <span className="flex items-center px-2.5 py-2 text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
          {amount}
        </span>
        <span className="flex items-center border-s border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-surface))] px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {code}
        </span>
      </span>
    );
  }

  return (
    <span className={className ?? "tabular-nums"} dir="ltr">
      {amount} {code}
    </span>
  );
}
