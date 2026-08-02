import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardNav } from "./DashboardNav";
import { StudentDashboardNav } from "./StudentDashboardNav";
import { getServerTranslator } from "@/lib/i18n/server";
import { IdleLogoutGuardLoader } from "@/components/IdleLogoutGuard";
import { getEffectivePermissions } from "@/lib/lms-features-db";
import { getStudentDashboardFlags } from "@/lib/student-dashboard";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const t = await getServerTranslator();
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const isAssistant = session.user.role === "ASSISTANT_ADMIN";
  const isTeacher = session.user.role === "TEACHER";
  const isStudent = session.user.role === "STUDENT";
  const perms = await getEffectivePermissions(session.user.id, session.user.role).catch(() => null);
  const canViewAnalytics = isAdmin || Boolean(perms?.canViewAnalytics);
  const canManageLibrary = isAdmin || Boolean(perms?.canManageLibrary);
  const canManageCoupons = isAdmin || Boolean(perms?.canManageCoupons);
  const canPostJobs = isAdmin || Boolean(perms?.canPostJobs);
  const elevatedNav = {
    canViewAnalytics,
    canManageLibrary,
    canManageCoupons,
    canPostJobs,
  };
  const hasElevatedStudentTools =
    isStudent &&
    (canViewAnalytics || canManageLibrary || canManageCoupons || canPostJobs);
  const studentFlags = isStudent ? await getStudentDashboardFlags() : null;

  return (
    <>
      <IdleLogoutGuardLoader />
      {isAdmin ? (
        <div className="admin-intro-loader" aria-hidden>
          <div className="admin-intro-stripe" />
          <div className="admin-intro-stripe" />
          <div className="admin-intro-stripe" />
          <div className="admin-intro-stripe" />
          <div className="admin-intro-claim">
            <span>{t("dashboard.introHello", "Welcome")}</span>
            <span>{t("dashboard.introBack", "back")}</span>
            <span>{t("dashboard.introAgain", "again")}</span>
          </div>
        </div>
      ) : null}
      <div
        className={`mx-auto max-w-6xl px-4 py-8 sm:px-6 ${
          isAdmin || isAssistant ? "dashboard-admin-glow relative isolate overflow-hidden rounded-2xl" : ""
        }`}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            {isStudent
              ? t("studentDash.title", "My learning hub")
              : t("dashboard.title", "Dashboard")}
          </h1>
          {!isStudent ? (
            <nav className="flex flex-wrap items-center gap-2">
              <DashboardNav
                isAdmin={isAdmin}
                isAssistant={isAssistant}
                isTeacher={isTeacher}
                canViewAnalytics={canViewAnalytics}
                canManageLibrary={canManageLibrary}
                canManageCoupons={canManageCoupons}
                canPostJobs={canPostJobs}
              />
            </nav>
          ) : null}
        </div>
        {isStudent && studentFlags ? (
          <div className="mb-8 space-y-3">
            <StudentDashboardNav flags={studentFlags} />
            {hasElevatedStudentTools ? (
              <nav className="flex flex-wrap items-center gap-2" aria-label="Granted permissions">
                <DashboardNav
                  isAdmin={false}
                  isAssistant={false}
                  isTeacher={false}
                  elevatedOnly
                  {...elevatedNav}
                />
              </nav>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </>
  );
}
