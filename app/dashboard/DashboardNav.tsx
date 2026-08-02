"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

const baseClass =
  "rounded-[var(--radius-btn)] border px-4 py-2 text-sm font-medium transition";
const inactiveClass =
  "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-border)]/50";
const activeClass =
  "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]";

function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href} className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}>
      {children}
    </Link>
  );
}

function ElevatedPermissionLinks({
  canViewAnalytics,
  canManageLibrary,
  canManageCoupons,
  canPostJobs,
}: {
  canViewAnalytics?: boolean;
  canManageLibrary?: boolean;
  canManageCoupons?: boolean;
  canPostJobs?: boolean;
}) {
  const t = useT();
  return (
    <>
      {canViewAnalytics ? (
        <NavLink href="/dashboard/analytics">{t("dashboardNav.analytics", "Analytics")}</NavLink>
      ) : null}
      {canManageCoupons ? (
        <NavLink href="/dashboard/coupons">{t("dashboardNav.coupons", "Coupons & discounts")}</NavLink>
      ) : null}
      {canManageLibrary ? (
        <NavLink href="/dashboard/library">{t("dashboardNav.platformLibrary", "Library")}</NavLink>
      ) : null}
      {canPostJobs ? (
        <NavLink href="/dashboard/jobs">{t("dashboardNav.jobs", "Jobs")}</NavLink>
      ) : null}
    </>
  );
}

export function DashboardNav({
  isAdmin,
  isAssistant,
  isTeacher,
  canViewAnalytics = false,
  canManageLibrary = false,
  canManageCoupons = false,
  canPostJobs = false,
  elevatedOnly = false,
}: {
  isAdmin: boolean;
  isAssistant: boolean;
  isTeacher: boolean;
  canViewAnalytics?: boolean;
  canManageLibrary?: boolean;
  canManageCoupons?: boolean;
  canPostJobs?: boolean;
  /** عرض روابط الصلاحيات الممنوحة فقط (مثل متدرب بصلاحيات إضافية) */
  elevatedOnly?: boolean;
}) {
  const t = useT();
  const isStaff = isAdmin || isAssistant;

  if (elevatedOnly) {
    return (
      <ElevatedPermissionLinks
        canViewAnalytics={canViewAnalytics}
        canManageLibrary={canManageLibrary}
        canManageCoupons={canManageCoupons}
        canPostJobs={canPostJobs}
      />
    );
  }

  if (isTeacher) {
    return (
      <>
        <NavLink href="/dashboard/courses">{t("dashboardNav.manageMyCourses", "Manage my courses")}</NavLink>
        <NavLink href="/dashboard/courses/new" exact>
          {t("dashboardNav.createCourse", "Create course")}
        </NavLink>
        <NavLink href="/dashboard/statistics">{t("dashboardNav.studentStats", "Student statistics")}</NavLink>
        <NavLink href="/dashboard/codes">{t("dashboardNav.activationCodes", "Activation codes")}</NavLink>
        <NavLink href="/dashboard/homework">{t("dashboardNav.homework", "Student homework")}</NavLink>
        <NavLink href="/dashboard/messages">{t("dashboardNav.contactMyStudents", "Contact my students")}</NavLink>
        <NavLink href="/dashboard/live-streams">{t("dashboardNav.liveStreams", "Live streams")}</NavLink>
        <ElevatedPermissionLinks
          canViewAnalytics={canViewAnalytics}
          canManageLibrary={canManageLibrary}
          canManageCoupons={canManageCoupons}
          canPostJobs={canPostJobs}
        />
      </>
    );
  }

  if (!isStaff) {
    return null;
  }

  return (
    <>
      <NavLink href="/dashboard" exact>
        {t("dashboardNav.overview", "Overview")}
      </NavLink>
      {canViewAnalytics ? (
        <NavLink href="/dashboard/analytics">
          {t("dashboardNav.analytics", "Analytics")}
        </NavLink>
      ) : null}
      <NavLink href="/dashboard/students">
        {isAdmin
          ? t("dashboardNav.studentsAccounts", "Students & accounts")
          : t("dashboardNav.students", "Students")}
      </NavLink>
      <NavLink href="/dashboard/wallets">
        {t("dashboardNav.wallets", "Wallets")}
      </NavLink>
      <NavLink href="/dashboard/statistics">
        {t("dashboardNav.studentStats", "Student statistics")}
      </NavLink>
      <NavLink href="/dashboard/password-change-requests">
        {t("dashboardNav.passwordChangeRequests", "Account change requests")}
      </NavLink>
      <NavLink href="/dashboard/codes">{t("dashboardNav.activationCodes", "Activation codes")}</NavLink>
      {canManageCoupons || isAdmin || isAssistant ? (
        <NavLink href="/dashboard/coupons">{t("dashboardNav.coupons", "Coupons & discounts")}</NavLink>
      ) : null}
      <NavLink href="/dashboard/homework">{t("dashboardNav.homework", "Student homework")}</NavLink>
      <NavLink href="/dashboard/messages">
        {t("dashboardNav.privateStudentMessages", "Private student messages")}
      </NavLink>
      <NavLink href="/dashboard/notifications">
        {t("dashboardNav.notifications", "Broadcast notifications")}
      </NavLink>
      <NavLink href="/dashboard/course-ratings">
        {t("dashboardNav.courseRatings", "Course ratings")}
      </NavLink>
      {isAdmin && (
        <>
          <NavLink href="/dashboard/courses">{t("dashboardNav.manageCourses", "Manage courses")}</NavLink>
          <NavLink href="/dashboard/courses/new" exact>
            {t("dashboardNav.createCourse", "Create course")}
          </NavLink>
          <NavLink href="/dashboard/reviews">{t("dashboardNav.studentReviews", "Student reviews")}</NavLink>
          <NavLink href="/dashboard/live-streams">{t("dashboardNav.liveStreams", "Live streams")}</NavLink>
          <NavLink href="/dashboard/teachers">{t("dashboardNav.multipleTeachers", "Teachers")}</NavLink>
          <NavLink href="/dashboard/subscriptions">
            {t("dashboardNav.platformSubscriptions", "Platform subscriptions")}
          </NavLink>
          <NavLink href="/dashboard/subscription-students">
            {t("dashboardNav.subscribedStudents", "Subscribed students")}
          </NavLink>
        </>
      )}
      {(canManageLibrary || isAdmin) && (
        <NavLink href="/dashboard/library">{t("dashboardNav.platformLibrary", "Library")}</NavLink>
      )}
      {(canPostJobs || isAdmin) && (
        <NavLink href="/dashboard/jobs">{t("dashboardNav.jobs", "Jobs")}</NavLink>
      )}
      <NavLink href="/dashboard/consultations">{t("dashboardNav.consultations", "Consultations")}</NavLink>
      <NavLink href="/dashboard/external-training">
        {t("dashboardNav.externalTraining", "External training")}
      </NavLink>
      <NavLink href="/dashboard/forum">{t("dashboardNav.forumAdmin", "Forum")}</NavLink>
      <NavLink href="/dashboard/settings/permissions">
        {t("dashboardNav.permissions", "Roles & permissions")}
      </NavLink>
      <NavLink href="/dashboard/landing-pages">
        {t("dashboardNav.landingPages", "Landing pages")}
      </NavLink>
      <NavLink href="/dashboard/settings/pages">{t("dashboardNav.pagesCms", "Pages & policies")}</NavLink>
      <NavLink href="/dashboard/settings/student-dashboard">
        {t("dashboardNav.studentDashboard", "Student dashboard")}
      </NavLink>
      <NavLink href="/dashboard/settings/search">{t("dashboardNav.searchSettings", "Search settings")}</NavLink>
      <NavLink href="/dashboard/settings/security">{t("dashboardNav.security", "Security & logs")}</NavLink>
      <NavLink href="/dashboard/settings/login-log">{t("dashboardNav.loginLog", "Login Log")}</NavLink>
      <NavLink href="/dashboard/settings/homepage">{t("dashboardNav.homepageSettings", "Homepage")}</NavLink>
      <NavLink href="/dashboard/settings/nav-tabs">{t("dashboardNav.navTabs", "Sidebar tabs")}</NavLink>
      <NavLink href="/dashboard/settings/homepage-sections">
        {t("dashboardNav.homepageSections", "Homepage sections")}
      </NavLink>
      <NavLink href="/dashboard/settings/add-balance">
        {t("dashboardNav.paymentMethods", "Payment methods")}
      </NavLink>
      <NavLink href="/dashboard/settings/labels">{t("dashboardNav.labels", "Labels")}</NavLink>
      <NavLink href="/dashboard/categories">{t("dashboardNav.categories", "Categories")}</NavLink>
      <NavLink href="/dashboard/settings/social-links">{t("dashboardNav.socialLinks", "Social links")}</NavLink>
      <NavLink href="/dashboard/settings/branding">{t("dashboardNav.branding", "Branding & SEO")}</NavLink>
      {isAdmin && (
        <NavLink href="/dashboard/settings/copyright-overlay">
          {t("dashboardNav.copyrightSettings", "Copyright overlay")}
        </NavLink>
      )}
      <NavLink href="/dashboard/settings/certificates">
        {t("dashboardNav.certificatesDesign", "Certificates")}
      </NavLink>
    </>
  );
}
