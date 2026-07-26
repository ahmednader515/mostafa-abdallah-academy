import Image from "next/image";
import Link from "next/link";
import { ProgressCircle } from "@/components/ProgressCircle";
import { DashboardStudentBalance } from "@/components/DashboardStudentBalance";
import { ActivateCodeSection } from "./ActivateCodeSection";
import { getServerTranslator } from "@/lib/i18n/server";
import type { StudentOverview } from "@/lib/student-dashboard";
import type { StudentDashboardFlags } from "@/lib/student-dashboard-flags";
import { STUDENT_DASHBOARD_SECTION_META } from "@/lib/student-dashboard-flags";

export async function StudentHomePanel({
  overview,
  flags,
}: {
  overview: StudentOverview;
  flags: StudentDashboardFlags;
}) {
  const t = await getServerTranslator();
  const shortcuts = STUDENT_DASHBOARD_SECTION_META.filter(
    (s) => s.key !== "home" && flags[s.key],
  ).slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex justify-center md:justify-start">
          {overview.user.image ? (
            <Image
              src={overview.user.image}
              alt=""
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-2xl font-bold text-[var(--color-primary)]">
              {overview.user.name.slice(0, 1)}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
            {t("studentDash.welcome", "Welcome")}, {overview.user.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {t(
              "studentDash.welcomeHint",
              "Track your courses, progress, subscriptions, and more from this hub.",
            )}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <DashboardStudentBalance balanceEgp={overview.user.balance} />
            <Link
              href="/dashboard/add-balance"
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
            >
              {t("dashboard.page.addBalanceButton", "Add balance")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-sm text-[var(--color-muted)]">
            {t("studentDash.subscriptionStatus", "Subscription")}
          </p>
          {overview.subscription.active ? (
            <>
              <p className="mt-2 font-semibold text-emerald-700">
                {t("studentDash.subActive", "Active")}
                {overview.subscription.planName ? ` — ${overview.subscription.planName}` : ""}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {overview.subscription.startsAt
                  ? `${t("studentDash.starts", "Starts")}: ${overview.subscription.startsAt.slice(0, 10)}`
                  : null}
                {overview.subscription.expiresAt
                  ? ` · ${t("studentDash.ends", "Ends")}: ${overview.subscription.expiresAt.slice(0, 10)}`
                  : null}
              </p>
            </>
          ) : (
            <p className="mt-2 font-semibold text-amber-700">
              {t("studentDash.subInactive", "No active subscription")}
            </p>
          )}
          {flags.subscriptions ? (
            <Link href="/dashboard/my-subscriptions" className="mt-3 inline-block text-sm underline">
              {t("studentDash.manageSub", "Manage subscription")}
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <ProgressCircle
            percent={overview.overallProgress}
            size={96}
            label={t("studentDash.overallProgress", "Learning progress")}
          />
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-sm text-[var(--color-muted)]">
            {t("studentDash.lastActivity", "Last activity")}
          </p>
          {overview.lastActivity ? (
            <>
              <p className="mt-2 font-medium">{overview.lastActivity.title}</p>
              <Link href={overview.lastActivity.href} className="mt-2 inline-block text-sm underline">
                {t("studentDash.continue", "Continue learning")}
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {t("studentDash.noActivity", "No recent activity yet")}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-sm text-[var(--color-muted)]">
            {t("studentDash.quickStats", "Quick stats")}
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-primary)]">{overview.courseCount}</p>
          <p className="text-xs text-[var(--color-muted)]">
            {t("studentDash.coursesCount", "Courses")}
          </p>
          <p className="mt-2 text-sm">
            {t("studentDash.unread", "Unread messages")}: {overview.unreadMessages}
          </p>
        </div>
      </section>

      <ActivateCodeSection />

      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("studentDash.shortcuts", "Shortcuts")}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((s) => (
            <Link
              key={s.key}
              href={s.href}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm font-medium transition hover:border-[var(--color-primary)]/40"
            >
              {t(`studentDash.nav.${s.key}`, s.labelEn)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
