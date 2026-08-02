"use client";

import Link from "next/link";
import { FormattedPrice } from "./FormattedPrice";
import { useT } from "./LocaleProvider";

export function DashboardStudentBalance({ balanceEgp }: { balanceEgp: number }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-[var(--color-muted)]">
        {t("wallet.currentBalanceLabel", "Your balance:")}
      </span>
      <Link
        href="/dashboard/wallet"
        className="text-2xl font-bold text-[var(--color-primary)] hover:underline"
      >
        <FormattedPrice amountEgp={balanceEgp} />
      </Link>
    </div>
  );
}
