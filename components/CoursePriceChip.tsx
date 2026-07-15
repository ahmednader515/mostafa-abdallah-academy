"use client";

import { FormattedPrice } from "./FormattedPrice";

export function CoursePriceChip({ amountEgp }: { amountEgp: number }) {
  return (
    <span className="rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-sm font-semibold text-[var(--color-primary)]">
      <FormattedPrice amountEgp={amountEgp} />
    </span>
  );
}
