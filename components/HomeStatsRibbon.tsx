"use client";

import { useLocale, useT } from "@/components/LocaleProvider";
import { HomeStatIcon } from "@/components/HomeStatIcon";
import {
  DEFAULT_HOMEPAGE_STATS,
  DEFAULT_STAT_ICON_BY_KIND,
  type HomepageStatItem,
} from "@/lib/homepage-hero-stats";

export function HomeStatsRibbon({ items }: { items?: HomepageStatItem[] | null }) {
  const t = useT();
  const locale = useLocale();
  const stats = items && items.length > 0 ? items : DEFAULT_HOMEPAGE_STATS;

  return (
    <section
      className="bg-[var(--color-sections)] px-3 pb-8 sm:px-5 lg:px-8"
      aria-label={t("home.statsAria", "Platform stats")}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 shadow-[var(--shadow-card)] sm:grid-cols-4 sm:gap-0 sm:px-2 sm:py-6">
        {stats.map((s, i) => {
          const icon = s.icon || DEFAULT_STAT_ICON_BY_KIND[s.kind];
          return (
            <div
              key={s.kind}
              className={`flex flex-col items-center justify-center gap-2 px-3 text-center sm:px-4 ${
                i < stats.length - 1 ? "sm:border-e sm:border-[var(--color-border)]" : ""
              }`}
            >
              <span
                className={
                  s.kind === "satisfaction"
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-primary)]"
                }
              >
                <HomeStatIcon icon={icon} />
              </span>
              <p className="text-lg font-extrabold text-[var(--color-foreground)] sm:text-xl">
                {s.value}
              </p>
              <p className="text-xs font-medium text-[var(--color-muted)] sm:text-sm">
                {locale === "en" ? s.labelEn || s.labelAr : s.labelAr || s.labelEn}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
