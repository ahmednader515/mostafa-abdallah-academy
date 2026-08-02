import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getSubscriptionsFeatureEnabled,
  listActiveSubscriptionPlansPublic,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { getStudentDashboardFlags, getStudentOverview } from "@/lib/student-dashboard";
import { getServerTranslator } from "@/lib/i18n/server";
import { StudentSubscriptionsPanel } from "../StudentSubscriptionsPanel";

export default async function StudentSubscriptionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  const flags = await getStudentDashboardFlags();
  if (!flags.subscriptions) redirect("/dashboard");

  const t = await getServerTranslator();
  const enabled = await getSubscriptionsFeatureEnabled().catch(() => false);
  const overview = await getStudentOverview(session.user.id);
  const plans = enabled ? await listActiveSubscriptionPlansPublic().catch(() => []) : [];
  const hasActive = await userHasActivePlatformSubscription(session.user.id).catch(() => false);
  const exp = hasActive ? await getLatestPlatformSubscriptionExpiry(session.user.id) : null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t("studentDash.nav.subscriptions", "Subscriptions")}</h2>
      {overview ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm">
          <p>
            <span className="text-[var(--color-muted)]">{t("studentDash.subscriptionStatus", "Subscription")}: </span>
            {overview.subscription.active
              ? `${t("studentDash.subActive", "Active")} — ${overview.subscription.planName ?? ""}`
              : t("studentDash.subInactive", "No active subscription")}
          </p>
          {overview.subscription.startsAt ? (
            <p className="mt-1">{t("studentDash.starts", "Starts")}: {overview.subscription.startsAt.slice(0, 10)}</p>
          ) : null}
          {overview.subscription.expiresAt ? (
            <p className="mt-1">{t("studentDash.ends", "Ends")}: {overview.subscription.expiresAt.slice(0, 10)}</p>
          ) : null}
          <p className="mt-2">
            {t("studentDash.coversCourses", "Courses covered")}:{" "}
            {overview.subscription.coversCourses ? t("common.yes", "Yes") : t("common.no", "No")}
          </p>
          <p>
            {t("studentDash.coversLibrary", "Library covered")}:{" "}
            {overview.subscription.coversLibrary ? t("common.yes", "Yes") : t("common.no", "No")}
          </p>
          {overview.subscription.planId ? (
            <Link
              href={`/subscriptions/${encodeURIComponent(overview.subscription.planId)}`}
              className="mt-3 inline-flex text-sm font-semibold text-[var(--color-primary)] underline"
            >
              {t("subscriptions.viewDetails", "التفاصيل")}
            </Link>
          ) : null}
        </div>
      ) : null}
      {enabled ? (
        <StudentSubscriptionsPanel
          plans={plans}
          hasActivePlatformSubscription={hasActive}
          activePlatformSubscriptionExpiresAtIso={exp ? exp.toISOString() : null}
        />
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          {t("studentDash.subsDisabled", "Subscriptions are not enabled.")}
        </p>
      )}
      <Link href="/" className="text-sm underline">
        {t("studentDash.browsePlans", "Browse plans on homepage")}
      </Link>
    </div>
  );
}
