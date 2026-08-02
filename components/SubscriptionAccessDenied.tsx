"use client";

import Link from "next/link";
import { useT } from "@/components/LocaleProvider";

/** رسالة عند محاولة فتح محتوى غير مشمول في الاشتراك */
export function SubscriptionAccessDenied({
  buyHref,
  buyLabel,
  className = "",
}: {
  buyHref?: string | null;
  buyLabel?: string | null;
  className?: string;
}) {
  const t = useT();
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-amber-500/40 bg-amber-50 px-4 py-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 ${className}`}
    >
      <p className="text-sm font-semibold sm:text-base">
        {t(
          "subscriptions.accessDeniedTitle",
          "هذا المحتوى غير متاح ضمن اشتراكك الحالي",
        )}
      </p>
      <p className="mt-1 text-sm opacity-90">
        {t(
          "subscriptions.accessDeniedBody",
          "يمكنك ترقية الاشتراك ليشمل هذا المحتوى، أو شراؤه بشكل منفصل إن كان متاحاً.",
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/#subscription-plans"
          className="inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
        >
          {t("subscriptions.upgradeOrViewPlans", "ترقية / عرض الاشتراكات")}
        </Link>
        {buyHref ? (
          <Link
            href={buyHref}
            className="inline-flex rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)]"
          >
            {buyLabel ?? t("subscriptions.buyContent", "شراء المحتوى")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
