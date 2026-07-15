"use client";

import { FormattedPrice } from "./FormattedPrice";
import { useT } from "./LocaleProvider";

export function DashboardStudentBalance({ balanceEgp }: { balanceEgp: number }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-[var(--color-muted)]">
        {t("dashboard.page.currentBalanceLabel", "Your balance:")}
      </span>
      <span className="text-2xl font-bold text-[var(--color-primary)]">
        <FormattedPrice amountEgp={balanceEgp} />
      </span>
    </div>
  );
}
