"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProgressCircle } from "@/components/ProgressCircle";
import { useT } from "@/components/LocaleProvider";
import type { AnalyticsPayload } from "@/lib/analytics-db";

type FilterOptions = {
  plans: { id: string; name: string }[];
  courses: { id: string; title: string }[];
  categories: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  countries: string[];
};

type QueryState = {
  preset: string;
  from: string;
  to: string;
  planId: string;
  courseId: string;
  categoryId: string;
  teacherId: string;
  userId: string;
  source: string;
  status: string;
  country: string;
  report: string;
};

const PIE_COLORS = ["#0f766e", "#0369a1", "#b45309", "#7c3aed", "#be123c"];

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="flex min-h-[100px] flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--color-primary)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p> : null}
    </div>
  );
}

function buildQs(q: QueryState): string {
  const p = new URLSearchParams();
  if (q.preset && q.preset !== "custom") p.set("preset", q.preset);
  if (q.preset === "custom") {
    if (q.from) p.set("from", q.from);
    if (q.to) p.set("to", q.to);
  }
  if (q.planId) p.set("planId", q.planId);
  if (q.courseId) p.set("courseId", q.courseId);
  if (q.categoryId) p.set("categoryId", q.categoryId);
  if (q.teacherId) p.set("teacherId", q.teacherId);
  if (q.userId) p.set("userId", q.userId);
  if (q.source && q.source !== "all") p.set("source", q.source);
  if (q.status && q.status !== "all") p.set("status", q.status);
  if (q.country) p.set("country", q.country);
  return p.toString();
}

export function AnalyticsDashboardClient({
  initialData,
  currency,
}: {
  initialData: AnalyticsPayload;
  currency: string;
}) {
  const t = useT();
  const [data, setData] = useState(initialData);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState<QueryState>({
    preset: "month",
    from: "",
    to: "",
    planId: "",
    courseId: "",
    categoryId: "",
    teacherId: "",
    userId: "",
    source: "all",
    status: "all",
    country: "",
    report: "summary",
  });

  useEffect(() => {
    void fetch("/api/dashboard/analytics/filters", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.plans) setOptions(d as FilterOptions);
      })
      .catch(() => undefined);
  }, []);

  const reload = useCallback(async (state: QueryState) => {
    setLoading(true);
    setError("");
    const qs = buildQs(state);
    const res = await fetch(`/api/dashboard/analytics?${qs}`, { credentials: "include" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? t("analytics.loadFailed", "Failed to load analytics"));
      return;
    }
    setData(json as AnalyticsPayload);
  }, [t]);

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    void reload(q);
  }

  function setPreset(preset: string) {
    const next = { ...q, preset };
    setQ(next);
    if (preset !== "custom") void reload(next);
  }

  const pieData = useMemo(
    () =>
      [
        { name: t("analytics.sourceCourse", "Courses"), value: data.sales.coursesRevenue },
        { name: t("analytics.sourceSub", "Subscriptions"), value: data.sales.subscriptionsRevenue },
        { name: t("analytics.sourceStore", "Library / store"), value: data.sales.storeRevenue },
      ].filter((x) => x.value > 0),
    [data.sales, t],
  );

  const exportHref = (format: "xlsx" | "csv") => {
    const qs = buildQs(q);
    const p = new URLSearchParams(qs);
    p.set("format", format);
    p.set("report", q.report);
    return `/api/dashboard/analytics/export?${p.toString()}`;
  };

  const printHref = () => {
    const qs = buildQs(q);
    return `/dashboard/analytics/print?${qs}`;
  };

  const egp = currency;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-foreground)]">
            {t("analytics.title", "Analytics dashboard")}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {t(
              "analytics.subtitle",
              "Platform KPIs, sales, subscriptions, and interactive charts.",
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="rounded-[var(--radius-btn)] border px-3 py-2 text-sm"
          >
            {t("analytics.filters", "Filters")}
          </button>
          <a
            href={exportHref("xlsx")}
            className="rounded-[var(--radius-btn)] border px-3 py-2 text-sm"
          >
            {t("analytics.exportExcel", "Export Excel")}
          </a>
          <a
            href={exportHref("csv")}
            className="rounded-[var(--radius-btn)] border px-3 py-2 text-sm"
          >
            {t("analytics.exportCsv", "Export CSV")}
          </a>
          <Link
            href={printHref()}
            target="_blank"
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white"
          >
            {t("analytics.exportPdf", "Export PDF")}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["today", t("analytics.presetToday", "Today")],
            ["week", t("analytics.presetWeek", "Week")],
            ["month", t("analytics.presetMonth", "Month")],
            ["year", t("analytics.presetYear", "Year")],
            ["custom", t("analytics.presetCustom", "Custom")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPreset(id)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              q.preset === id
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-border)]"
            }`}
          >
            {label}
          </button>
        ))}
        {loading ? (
          <span className="text-sm text-[var(--color-muted)]">{t("common.loading", "Loading")}…</span>
        ) : null}
      </div>

      {q.preset === "custom" || showFilters ? (
        <form
          onSubmit={applyFilters}
          className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {q.preset === "custom" ? (
            <>
              <label className="text-sm">
                <span className="mb-1 block text-[var(--color-muted)]">{t("analytics.from", "From")}</span>
                <input
                  type="date"
                  value={q.from}
                  onChange={(e) => setQ((s) => ({ ...s, from: e.target.value }))}
                  className="w-full rounded border px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-[var(--color-muted)]">{t("analytics.to", "To")}</span>
                <input
                  type="date"
                  value={q.to}
                  onChange={(e) => setQ((s) => ({ ...s, to: e.target.value }))}
                  className="w-full rounded border px-3 py-2"
                />
              </label>
            </>
          ) : null}

          <label className="text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">{t("analytics.source", "Source")}</span>
            <select
              value={q.source}
              onChange={(e) => setQ((s) => ({ ...s, source: e.target.value }))}
              className="w-full rounded border px-3 py-2"
            >
              <option value="all">{t("analytics.all", "All")}</option>
              <option value="course">{t("analytics.sourceCourse", "Courses")}</option>
              <option value="subscription">{t("analytics.sourceSub", "Subscriptions")}</option>
              <option value="store">{t("analytics.sourceStore", "Library / store")}</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">{t("analytics.status", "Status")}</span>
            <select
              value={q.status}
              onChange={(e) => setQ((s) => ({ ...s, status: e.target.value }))}
              className="w-full rounded border px-3 py-2"
            >
              <option value="all">{t("analytics.all", "All")}</option>
              <option value="paid">{t("analytics.paid", "Paid")}</option>
              <option value="free">{t("analytics.free", "Free")}</option>
              <option value="active">{t("analytics.active", "Active sub")}</option>
              <option value="expired">{t("analytics.expired", "Expired sub")}</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">{t("analytics.plan", "Subscription plan")}</span>
            <select
              value={q.planId}
              onChange={(e) => setQ((s) => ({ ...s, planId: e.target.value }))}
              className="w-full rounded border px-3 py-2"
            >
              <option value="">{t("analytics.all", "All")}</option>
              {options?.plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">{t("analytics.course", "Course")}</span>
            <select
              value={q.courseId}
              onChange={(e) => setQ((s) => ({ ...s, courseId: e.target.value }))}
              className="w-full rounded border px-3 py-2"
            >
              <option value="">{t("analytics.all", "All")}</option>
              {options?.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">{t("analytics.category", "Category")}</span>
            <select
              value={q.categoryId}
              onChange={(e) => setQ((s) => ({ ...s, categoryId: e.target.value }))}
              className="w-full rounded border px-3 py-2"
            >
              <option value="">{t("analytics.all", "All")}</option>
              {options?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">{t("analytics.teacher", "Teacher")}</span>
            <select
              value={q.teacherId}
              onChange={(e) => setQ((s) => ({ ...s, teacherId: e.target.value }))}
              className="w-full rounded border px-3 py-2"
            >
              <option value="">{t("analytics.all", "All")}</option>
              {options?.teachers.map((tch) => (
                <option key={tch.id} value={tch.id}>
                  {tch.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">{t("analytics.userId", "User ID")}</span>
            <input
              value={q.userId}
              onChange={(e) => setQ((s) => ({ ...s, userId: e.target.value }))}
              className="w-full rounded border px-3 py-2"
              dir="ltr"
              placeholder="user id"
            />
          </label>

          {options?.countries.length ? (
            <label className="text-sm">
              <span className="mb-1 block text-[var(--color-muted)]">{t("analytics.country", "Country")}</span>
              <select
                value={q.country}
                onChange={(e) => setQ((s) => ({ ...s, country: e.target.value }))}
                className="w-full rounded border px-3 py-2"
              >
                <option value="">{t("analytics.all", "All")}</option>
                {options.countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">{t("analytics.reportType", "Export report")}</span>
            <select
              value={q.report}
              onChange={(e) => setQ((s) => ({ ...s, report: e.target.value }))}
              className="w-full rounded border px-3 py-2"
            >
              <option value="summary">{t("analytics.reportSummary", "Summary")}</option>
              <option value="sales">{t("analytics.reportSales", "Sales series")}</option>
              <option value="subscriptions">{t("analytics.reportSubs", "Subscriptions")}</option>
              <option value="courses">{t("analytics.reportCourses", "Top courses")}</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              {t("analytics.apply", "Apply")}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* KPIs */}
      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("analytics.kpis", "General stats")}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <KpiCard label={t("analytics.totalUsers", "Total users")} value={data.kpis.totalUsers} />
          <KpiCard label={t("analytics.newStudents", "New students")} value={data.kpis.newStudents} />
          <KpiCard label={t("analytics.coursesSold", "Courses sold")} value={data.kpis.coursesSold} />
          <KpiCard
            label={t("analytics.activeSubs", "Active subscriptions")}
            value={data.kpis.activeSubscriptions}
          />
          <KpiCard
            label={t("analytics.expiredSubs", "Expired subscriptions")}
            value={data.kpis.expiredSubscriptions}
          />
          <KpiCard
            label={t("analytics.totalSales", "Total sales")}
            value={`${data.kpis.totalSales.toFixed(0)} ${egp}`}
          />
          <KpiCard
            label={t("analytics.totalProfit", "Total profit")}
            value={`${data.kpis.totalProfit.toFixed(0)} ${egp}`}
          />
          <KpiCard label={t("analytics.purchases", "Purchases")} value={data.kpis.purchaseCount} />
          <KpiCard
            label={t("analytics.freeEnrollments", "Free enrollments")}
            value={data.kpis.freeEnrollments}
          />
          <KpiCard label={t("analytics.activeUsers", "Active users")} value={data.kpis.activeUsers} />
        </div>
      </section>

      {/* Ratios */}
      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("analytics.ratios", "Percentages")}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              [data.ratios.userGrowth, t("analytics.userGrowth", "User growth")],
              [data.ratios.courseCompletion, t("analytics.courseCompletion", "Course completion")],
              [data.ratios.newSubscriptionShare, t("analytics.newSubShare", "New subscriptions share")],
              [data.ratios.salesCourseShare, t("analytics.salesCourseShare", "Course sales share")],
              [data.ratios.salesSubscriptionShare, t("analytics.salesSubShare", "Subscription sales share")],
              [data.ratios.salesStoreShare, t("analytics.salesStoreShare", "Store sales share")],
              [data.ratios.traineeEngagement, t("analytics.engagement", "Trainee engagement")],
              [data.ratios.topCourseDemandShare, t("analytics.topCourseDemand", "Top course demand")],
            ] as [number, string][]
          ).map(([pct, label]) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <ProgressCircle percent={Math.max(0, Math.min(100, pct))} size={88} label={label} />
            </div>
          ))}
        </div>
      </section>

      {/* Sales breakdown */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold">{t("analytics.salesBreakdown", "Sales & profit")}</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-2">
              <span>{t("analytics.coursesRevenue", "Courses revenue")}</span>
              <span className="font-semibold tabular-nums">
                {data.sales.coursesRevenue.toFixed(0)} {egp}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span>{t("analytics.subsRevenue", "Subscriptions revenue")}</span>
              <span className="font-semibold tabular-nums">
                {data.sales.subscriptionsRevenue.toFixed(0)} {egp}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span>{t("analytics.storeRevenue", "Library revenue")}</span>
              <span className="font-semibold tabular-nums">
                {data.sales.storeRevenue.toFixed(0)} {egp}
              </span>
            </li>
            <li className="flex justify-between gap-2">
              <span>{t("analytics.storeProfit", "Library profit")}</span>
              <span className="font-semibold tabular-nums">
                {data.sales.storeProfit.toFixed(0)} {egp}
              </span>
            </li>
            <li className="flex justify-between gap-2 border-t pt-2">
              <span>{t("analytics.avgOrder", "Avg. order value")}</span>
              <span className="font-semibold tabular-nums">
                {data.sales.avgOrderValue.toFixed(2)} {egp}
              </span>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold">{t("analytics.revenueMix", "Revenue mix")}</h3>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-muted)]">
              {t("analytics.noData", "No data for this period")}
            </p>
          ) : (
            <div className="h-56" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold">{t("analytics.salesOverTime", "Sales over time")}</h3>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" name={t("analytics.totalSales", "Total sales")} stroke="#0f766e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" name={t("analytics.totalProfit", "Total profit")} stroke="#0369a1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold">{t("analytics.studentGrowth", "Student growth")}</h3>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" name={t("analytics.newStudents", "New students")} fill="#0f766e" />
                <Bar dataKey="subscriptions" name={t("analytics.subsShort", "Subs")} fill="#b45309" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Subscriptions */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{t("analytics.subsAnalysis", "Subscription analysis")}</h3>
          <p className="text-xs text-[var(--color-muted)]">
            {t("analytics.newInPeriod", "New")}: {data.subscriptions.newInPeriod} ·{" "}
            {t("analytics.renewals", "Renewals")}: {data.subscriptions.renewals} ·{" "}
            {t("analytics.expiredInPeriod", "Expired")}: {data.subscriptions.expiredInPeriod}
            {data.subscriptions.topPlanName
              ? ` · ${t("analytics.topPlan", "Top plan")}: ${data.subscriptions.topPlanName}`
              : ""}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-start text-[var(--color-muted)]">
                <th className="p-2 text-start">{t("analytics.plan", "Subscription plan")}</th>
                <th className="p-2 text-start">{t("analytics.activeSubs", "Active subscriptions")}</th>
                <th className="p-2 text-start">{t("analytics.newInPeriod", "New")}</th>
                <th className="p-2 text-start">{t("analytics.renewals", "Renewals")}</th>
                <th className="p-2 text-start">{t("analytics.expired", "Expired sub")}</th>
                <th className="p-2 text-start">{t("analytics.revenue", "Revenue")}</th>
              </tr>
            </thead>
            <tbody>
              {data.subscriptions.byPlan.map((row) => (
                <tr key={row.planId} className="border-b border-[var(--color-border)]/60">
                  <td className="p-2 font-medium">{row.planName}</td>
                  <td className="p-2 tabular-nums">{row.subscribers}</td>
                  <td className="p-2 tabular-nums">{row.newInPeriod}</td>
                  <td className="p-2 tabular-nums">{row.renewals}</td>
                  <td className="p-2 tabular-nums">{row.expired}</td>
                  <td className="p-2 tabular-nums">
                    {row.revenue.toFixed(0)} {egp}
                  </td>
                </tr>
              ))}
              {data.subscriptions.byPlan.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-[var(--color-muted)]">
                    {t("analytics.noData", "No data for this period")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rankings */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold">{t("analytics.topCourses", "Top selling courses")}</h3>
          <ul className="space-y-2 text-sm">
            {data.rankings.topCourses.map((c, i) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span>
                  {i + 1}. {c.name}
                </span>
                <span className="tabular-nums text-[var(--color-muted)]">
                  {c.value} · {(c.extra ?? 0).toFixed(0)} {egp}
                </span>
              </li>
            ))}
            {data.rankings.topCourses.length === 0 ? (
              <li className="text-[var(--color-muted)]">{t("analytics.noData", "No data for this period")}</li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold">{t("analytics.topWatched", "Most watched content")}</h3>
          <ul className="space-y-2 text-sm">
            {data.rankings.topWatched.map((c, i) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span>
                  {i + 1}. {c.name}
                </span>
                <span className="tabular-nums text-[var(--color-muted)]">
                  {c.value}% · {c.extra ?? 0}
                </span>
              </li>
            ))}
            {data.rankings.topWatched.length === 0 ? (
              <li className="text-[var(--color-muted)]">{t("analytics.noData", "No data for this period")}</li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
