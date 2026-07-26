import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireStaffPermission } from "@/lib/require-permission";
import {
  getAnalyticsDashboard,
  resolveAnalyticsRange,
} from "@/lib/analytics-db";
import { getServerTranslator } from "@/lib/i18n/server";
import { AnalyticsDashboardClient } from "./AnalyticsDashboardClient";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const gate = await requireStaffPermission(
    session.user.id,
    session.user.role,
    "canViewAnalytics",
  );
  if (!gate.ok) redirect("/dashboard");

  const t = await getServerTranslator();
  const range = resolveAnalyticsRange({ preset: "month" });
  const data = await getAnalyticsDashboard(range).catch(() => null);
  if (!data) {
    return (
      <p className="text-sm text-red-600">
        {t("analytics.loadFailed", "Failed to load analytics")}
      </p>
    );
  }

  const currency = t("common.egyptianPoundShort", "EGP");

  return <AnalyticsDashboardClient initialData={data} currency={currency} />;
}
