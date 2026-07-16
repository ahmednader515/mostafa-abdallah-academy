"use client";

import { useLocale, useT } from "@/components/LocaleProvider";
import {
  DEFAULT_HOMEPAGE_STATS,
  type HomepageStatItem,
  type HomepageStatKind,
} from "@/lib/homepage-hero-stats";

function StatIcon({ kind }: { kind: HomepageStatKind }) {
  const common = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "students") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
        <circle {...common} cx="9" cy="8" r="3" />
        <circle {...common} cx="17" cy="9" r="2.5" />
        <path {...common} d="M3.5 19c.8-3 3-4.5 5.5-4.5S13.7 16 14.5 19" />
        <path {...common} d="M14 15.2c1.1-.7 2.4-1 3.7-1 1.6 0 3 .5 4 1.6" />
      </svg>
    );
  }
  if (kind === "courses") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M10 9.5 16 12l-6 2.5v-5z" />
      </svg>
    );
  }
  if (kind === "trainers") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
        <path {...common} d="M4 14 12 9l8 5-8 5-8-5z" />
        <path {...common} d="M12 9v10M7 11.5v2M17 11.5v2" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
      <path {...common} d="M8 4h8l1 3H7l1-3z" />
      <path {...common} d="M7 7h10v4a5 5 0 0 1-10 0V7z" />
      <path {...common} d="M10 16v4l2-1 2 1v-4" />
    </svg>
  );
}

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
        {stats.map((s, i) => (
          <div
            key={s.kind}
            className={`flex flex-col items-center justify-center gap-2 px-3 text-center sm:px-4 ${
              i < stats.length - 1 ? "sm:border-e sm:border-[var(--color-border)]" : ""
            }`}
          >
            <span
              className={
                s.kind === "satisfaction" ? "text-[var(--color-accent)]" : "text-[var(--color-primary)]"
              }
            >
              <StatIcon kind={s.kind} />
            </span>
            <p className="text-lg font-extrabold text-[var(--color-foreground)] sm:text-xl">{s.value}</p>
            <p className="text-xs font-medium text-[var(--color-muted)] sm:text-sm">
              {locale === "en" ? s.labelEn || s.labelAr : s.labelAr || s.labelEn}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
