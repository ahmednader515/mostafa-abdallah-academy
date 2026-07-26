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

export function DashboardNav({
  isAdmin,
  isAssistant,
  isTeacher,
  canViewAnalytics = false,
}: {
  isAdmin: boolean;
  isAssistant: boolean;
  isTeacher: boolean;
  canViewAnalytics?: boolean;
}) {
  const t = useT();
  const isStaff = isAdmin || isAssistant;

  if (isTeacher) {
    return (
      <>
        <NavLink href="/dashboard/courses">{t("dashboardNav.manageMyCourses", "Manage my courses")}</NavLink>
        <NavLink href="/dashboard/courses/new" exact>
          {t("dashboardNav.createCourse", "Create course")}
        </NavLink>
        <NavLink href="/dashboard/statistics">{t("dashboardNav.studentStats", "Student statistics")}</NavLink>
        <NavLink href="/dashboard/codes">{t("dashboardNav.createCodes", "Create codes")}</NavLink>
        <NavLink href="/dashboard/homework">{t("dashboardNav.homework", "Student homework")}</NavLink>
        <NavLink href="/dashboard/messages">{t("dashboardNav.contactMyStudents", "Contact my students")}</NavLink>
        <NavLink href="/dashboard/live-streams">{t("dashboardNav.liveStreams", "Live streams")}</NavLink>
      </>
    );
  }

  if (!isStaff) {
    return null;
  }

  return (
    <>
      <NavLink href="/dashboard">
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
      <NavLink href="/dashboard/statistics">
        {t("dashboardNav.studentStats", "Student statistics")}
      </NavLink>
      <NavLink href="/dashboard/password-change-requests">
        {t("dashboardNav.passwordChangeRequests", "Account change requests")}
      </NavLink>
      <NavLink href="/dashboard/codes">{t("dashboardNav.createCodes", "Create codes")}</NavLink>
      <NavLink href="/dashboard/coupons">{t("dashboardNav.coupons", "Coupons")}</NavLink>
      <NavLink href="/dashboard/homework">{t("dashboardNav.homework", "Student homework")}</NavLink>
      <NavLink href="/dashboard/messages">
        {t("dashboardNav.privateStudentMessages", "Private student messages")}
      </NavLink>
      <NavLink href="/dashboard/notifications">
        {t("dashboardNav.notifications", "Broadcast notifications")}
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
          <NavLink href="/dashboard/library">{t("dashboardNav.platformLibrary", "Library")}</NavLink>
          <NavLink href="/dashboard/jobs">{t("dashboardNav.jobs", "Jobs")}</NavLink>
        </>
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
