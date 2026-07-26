"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import type { AnalyticsPayload } from "@/lib/analytics-db";

export function AnalyticsPrintClient() {
  const t = useT();
  const sp = useSearchParams();
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const qs = sp.toString();
    void fetch(`/api/dashboard/analytics?${qs}`, { credentials: "include" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "Failed");
        setData(j as AnalyticsPayload);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [sp]);

  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, [data]);

  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!data) return <p className="p-8">{t("common.loading", "Loading")}…</p>;

  const egp = t("common.egyptianPoundShort", "EGP");

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-black print:p-0">
      <h1 className="text-2xl font-bold">{t("analytics.title", "Analytics dashboard")}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {data.meta.from.slice(0, 10)} → {data.meta.to.slice(0, 10)}
      </p>

      <h2 className="mt-8 text-lg font-semibold">{t("analytics.kpis", "General stats")}</h2>
      <table className="mt-3 w-full border-collapse text-sm">
        <tbody>
          {(
            [
              [t("analytics.totalUsers", "Total users"), data.kpis.totalUsers],
              [t("analytics.newStudents", "New students"), data.kpis.newStudents],
              [t("analytics.coursesSold", "Courses sold"), data.kpis.coursesSold],
              [t("analytics.activeSubs", "Active subscriptions"), data.kpis.activeSubscriptions],
              [t("analytics.expiredSubs", "Expired subscriptions"), data.kpis.expiredSubscriptions],
              [t("analytics.totalSales", "Total sales"), `${data.kpis.totalSales.toFixed(0)} ${egp}`],
              [t("analytics.totalProfit", "Total profit"), `${data.kpis.totalProfit.toFixed(0)} ${egp}`],
              [t("analytics.purchases", "Purchases"), data.kpis.purchaseCount],
              [t("analytics.freeEnrollments", "Free enrollments"), data.kpis.freeEnrollments],
              [t("analytics.activeUsers", "Active users"), data.kpis.activeUsers],
            ] as [string, string | number][]
          ).map(([k, v]) => (
            <tr key={k} className="border-b">
              <td className="py-2">{k}</td>
              <td className="py-2 text-end font-semibold">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-8 text-lg font-semibold">{t("analytics.salesBreakdown", "Sales & profit")}</h2>
      <table className="mt-3 w-full border-collapse text-sm">
        <tbody>
          <tr className="border-b">
            <td className="py-2">{t("analytics.coursesRevenue", "Courses revenue")}</td>
            <td className="py-2 text-end">{data.sales.coursesRevenue.toFixed(0)} {egp}</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">{t("analytics.subsRevenue", "Subscriptions revenue")}</td>
            <td className="py-2 text-end">{data.sales.subscriptionsRevenue.toFixed(0)} {egp}</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">{t("analytics.storeRevenue", "Library revenue")}</td>
            <td className="py-2 text-end">{data.sales.storeRevenue.toFixed(0)} {egp}</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">{t("analytics.avgOrder", "Avg. order value")}</td>
            <td className="py-2 text-end">{data.sales.avgOrderValue.toFixed(2)} {egp}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-8 text-lg font-semibold">{t("analytics.subsAnalysis", "Subscription analysis")}</h2>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-start">
            <th className="py-2 text-start">{t("analytics.plan", "Subscription plan")}</th>
            <th className="py-2 text-end">{t("analytics.revenue", "Revenue")}</th>
          </tr>
        </thead>
        <tbody>
          {data.subscriptions.byPlan.map((p) => (
            <tr key={p.planId} className="border-b">
              <td className="py-2">{p.planName}</td>
              <td className="py-2 text-end">
                {p.revenue.toFixed(0)} {egp}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        type="button"
        onClick={() => window.print()}
        className="mt-8 rounded bg-slate-900 px-4 py-2 text-sm text-white print:hidden"
      >
        {t("analytics.exportPdf", "Export PDF")}
      </button>
    </div>
  );
}
