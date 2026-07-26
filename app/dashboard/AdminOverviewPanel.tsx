"use client";

import Link from "next/link";
import { ProgressCircle } from "@/components/ProgressCircle";
import { useLocale, useT } from "@/components/LocaleProvider";
import type { DashboardOverview } from "@/lib/dashboard-overview";

function formatMonthLabel(label: string, locale: string): string {
  // Expect YYYY-MM
  const m = /^(\d{4})-(\d{2})$/.exec(label.trim());
  if (!m) return label;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const date = new Date(Date.UTC(year, month - 1, 1));
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return `${m[2]}/${String(year).slice(2)}`;
  }
}

function MiniBarChart({
  items,
  valueKey,
  emptyLabel,
  locale,
}: {
  items: { label: string; count?: number; amount?: number }[];
  valueKey: "count" | "amount";
  emptyLabel: string;
  locale: string;
}) {
  const values = items.map((i) => Number(i[valueKey] ?? 0));
  const hasData = values.some((v) => v > 0);
  const max = Math.max(1, ...values);

  if (!items.length || !hasData) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-background)]/60 px-4 text-center text-sm text-[var(--color-muted)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex h-44 items-end gap-2 sm:gap-3" dir="ltr">
      {items.map((item) => {
        const v = Number(item[valueKey] ?? 0);
        const h = Math.round((v / max) * 100);
        return (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[11px] font-medium tabular-nums text-[var(--color-muted)]">
              {valueKey === "amount" ? Math.round(v) : v}
            </span>
            <div className="flex h-28 w-full items-end justify-center">
              <div
                className="w-full max-w-10 rounded-t-md bg-[var(--color-primary)] transition-all"
                style={{ height: `${Math.max(v > 0 ? 8 : 3, h)}%`, opacity: v > 0 ? 0.9 : 0.2 }}
                title={`${formatMonthLabel(item.label, locale)}: ${v}`}
              />
            </div>
            <span className="w-full truncate text-center text-[10px] text-[var(--color-muted)]">
              {formatMonthLabel(item.label, locale)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[112px] flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/35 hover:shadow-md"
    >
      <p className="text-sm leading-snug text-[var(--color-muted)]">{label}</p>
      <div>
        <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-[var(--color-primary)]">
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p> : null}
      </div>
    </Link>
  );
}

export function AdminOverviewPanel({ overview }: { overview: DashboardOverview }) {
  const t = useT();
  const locale = useLocale();
  const egp = t("common.egyptianPoundShort", "EGP");
  const empty = t("dashboard.overview.noChartData", "No data for this period yet");

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {t("dashboard.overview.title", "Platform overview")}
          </h2>
          <Link
            href="/dashboard/analytics"
            className="text-sm font-medium text-[var(--color-primary)] underline"
          >
            {t("dashboard.overview.openAnalytics", "Open full analytics")}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5">
          <StatCard
            href="/dashboard/students"
            label={t("dashboard.overview.students", "Students")}
            value={overview.students}
          />
          <StatCard
            href="/dashboard/teachers"
            label={t("dashboard.overview.teachers", "Teachers")}
            value={overview.teachers}
          />
          <StatCard
            href="/dashboard/courses"
            label={t("dashboard.overview.courses", "Courses")}
            value={overview.courses}
          />
          <StatCard
            href="/dashboard/subscription-students"
            label={t("dashboard.overview.activeSubscribers", "Active subscribers")}
            value={overview.activeSubscribers}
          />
          <StatCard
            href="/dashboard/statistics"
            label={t("dashboard.overview.sales", "Sales")}
            value={`${overview.salesRevenue.toFixed(0)} ${egp}`}
            hint={`${overview.salesCount} ${t("dashboard.overview.orders", "orders")}`}
          />
          <StatCard
            href="/dashboard/library"
            label={t("dashboard.overview.library", "Library files")}
            value={overview.libraryFiles}
          />
          <StatCard
            href="/dashboard/jobs"
            label={t("dashboard.overview.jobs", "Jobs")}
            value={overview.jobs}
          />
          <StatCard
            href="/dashboard/messages"
            label={t("dashboard.overview.unreadMessages", "Unread messages")}
            value={overview.unreadMessages}
          />
          <StatCard
            href="/dashboard/students"
            label={t("dashboard.overview.activeUsers", "Active users (7d)")}
            value={overview.activeUsers}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <h3 className="mb-5 text-sm font-semibold text-[var(--color-foreground)]">
            {t("dashboard.overview.traineeProgress", "Trainee progress")}
          </h3>
          <div className="flex justify-center py-2">
            <ProgressCircle
              percent={overview.avgTraineeProgress}
              size={112}
              label={t("dashboard.overview.avgWatch", "Avg. watch")}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <h3 className="mb-5 text-sm font-semibold text-[var(--color-foreground)]">
            {t("dashboard.overview.courseCompletion", "Course completion")}
          </h3>
          <div className="flex justify-center py-2">
            <ProgressCircle
              percent={overview.courseCompletionRate}
              size={112}
              label={t("dashboard.overview.completion", "Completion")}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              {t("dashboard.overview.newSubs", "New subscriptions")}
            </h3>
            <span className="text-[11px] text-[var(--color-muted)]">
              {t("dashboard.overview.lastMonths", "Last 6 months")}
            </span>
          </div>
          <MiniBarChart
            items={overview.newSubscriptionsByMonth}
            valueKey="count"
            emptyLabel={empty}
            locale={locale}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              {t("dashboard.overview.registrations", "Student registrations")}
            </h3>
            <span className="text-[11px] text-[var(--color-muted)]">
              {t("dashboard.overview.lastMonths", "Last 6 months")}
            </span>
          </div>
          <MiniBarChart
            items={overview.registrationsByMonth}
            valueKey="count"
            emptyLabel={empty}
            locale={locale}
          />
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              {t("dashboard.overview.monthlySales", "Monthly sales")}
            </h3>
            <span className="text-[11px] text-[var(--color-muted)]">
              {t("dashboard.overview.lastMonths", "Last 6 months")}
            </span>
          </div>
          <MiniBarChart
            items={overview.salesByMonth}
            valueKey="amount"
            emptyLabel={empty}
            locale={locale}
          />
        </div>
      </section>
    </div>
  );
}
