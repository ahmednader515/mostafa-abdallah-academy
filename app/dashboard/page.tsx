import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import {
  getUserById,
  getAccessibleCoursesForUser,
  countUsersByRole,
  countCourses,
  getAllQuizAttemptsForAdmin,
  getTotalPlatformEarnings,
  getCoursesWithCountsForCreator,
  getSubscriptionsFeatureEnabled,
  listActiveSubscriptionPlansPublic,
  listStudentStorePurchases,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
  getEnrollmentsWithCourseByUserId,
} from "@/lib/db";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { getServerTranslator } from "@/lib/i18n/server";
import { MyCoursesSection } from "./MyCoursesSection";
import { ActivateCodeSection } from "./ActivateCodeSection";
import { StudentSubscriptionsPanel } from "./StudentSubscriptionsPanel";
import { DashboardStudentBalance } from "@/components/DashboardStudentBalance";
import { AdminOverviewPanel } from "./AdminOverviewPanel";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const t = await getServerTranslator();

  const isAdmin = session.user.role === "ADMIN";
  const isAssistant = session.user.role === "ASSISTANT_ADMIN";
  const isStudent = session.user.role === "STUDENT";
  const isTeacher = session.user.role === "TEACHER";

  if (isTeacher) {
    const myCourses = await getCoursesWithCountsForCreator(session.user.id).catch(() => []);
    const publishedCount = myCourses.filter((c) => {
      const row = c as Record<string, unknown>;
      return Boolean(row.isPublished ?? row.is_published ?? false);
    }).length;

    return (
      <div className="space-y-8">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {t("dashboard.page.greetingComma", "Welcome,")} {session.user.name}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {t(
              "dashboard.page.teacherIntro",
              "Teacher dashboard: manage your courses, enrolled students, homework, live streams, and activation codes from the menu above.",
            )}
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
            {t("dashboard.page.shortcutsTitle", "Shortcuts")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/courses"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.myCoursesTitle", "My courses")}
              </h3>
              <p className="mt-1 text-2xl font-bold text-[var(--color-primary)]">{myCourses.length}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("dashboard.page.publishedLabel", "Published:")} {publishedCount}
              </p>
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.editProfileTitle", "Edit profile")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t(
                  "dashboard.page.editProfileDesc",
                  "Name, password, photo, and subject shown to students",
                )}
              </p>
            </Link>
            <Link
              href="/dashboard/statistics"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.studentStatisticsTitle", "Student statistics")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t(
                  "dashboard.page.studentStatisticsDesc",
                  "Quiz scores and enrollments in your courses",
                )}
              </p>
            </Link>
            <Link
              href="/dashboard/messages"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.contactStudentsTitle", "Contact students")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("dashboard.page.contactStudentsDesc", "Students enrolled in your courses")}
              </p>
            </Link>
            <Link
              href="/dashboard/homework"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.receiveHomeworkTitle", "Collect homework")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("dashboard.page.receiveHomeworkDesc", "Submissions for your courses")}
              </p>
            </Link>
            <Link
              href="/dashboard/live-streams"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.liveStreamsCardTitle", "Live streams")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("dashboard.page.liveStreamsCardDesc", "Link Zoom or Meet to your courses")}
              </p>
            </Link>
            <Link
              href="/dashboard/codes"
              className="flex min-h-[160px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
            >
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {t("dashboard.page.activationCodesTitle", "Activation codes")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {t("dashboard.page.activationCodesSubtitle", "For your courses only")}
              </p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isStudent) {
    const [{ getStudentOverview, getStudentDashboardFlags }, { StudentHomePanel }] = await Promise.all([
      import("@/lib/student-dashboard"),
      import("./StudentHomePanel"),
    ]);
    const [overview, flags] = await Promise.all([
      getStudentOverview(session.user.id),
      getStudentDashboardFlags(),
    ]);
    if (!overview) redirect("/login");
    return <StudentHomePanel overview={overview} flags={flags} />;
  }

  const [studentsCount, coursesCount, _quizAttempts, totalEarnings, overview] = await Promise.all([
    countUsersByRole("STUDENT"),
    countCourses(),
    getAllQuizAttemptsForAdmin().catch(() => []),
    getTotalPlatformEarnings(),
    getDashboardOverview().catch(() => null),
  ]);

  void _quizAttempts;

  return (
    <div className="space-y-8">
      {(isAdmin || isAssistant) && overview ? <AdminOverviewPanel overview={overview} /> : null}
      {(isAdmin || isAssistant) && (
        <>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
              {t("dashboard.page.platformCoursesSectionTitle", "Platform courses")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {isAdmin && (
                <Link
                  href="/dashboard/courses"
                  className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
                >
                  <h3 className="font-semibold text-[var(--color-foreground)]">
                    {t("dashboard.page.manageCoursesTitle", "Manage courses")}
                  </h3>
                  <p className="mt-1 text-3xl font-bold text-[var(--color-primary)]">{coursesCount}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {t(
                      "dashboard.page.manageCoursesMeta",
                      "Edit or delete courses · create a new course",
                    )}
                  </p>
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/dashboard/courses/new"
                  className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
                >
                  <h3 className="font-semibold text-[var(--color-foreground)]">
                    {t("dashboard.page.createNewCourseTitle", "Create course")}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {t(
                      "dashboard.page.createNewCourseMeta",
                      "Add a new course with content, lessons, and quizzes",
                    )}
                  </p>
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/dashboard/live-streams"
                  className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
                >
                  <h3 className="font-semibold text-[var(--color-foreground)]">
                    {t("dashboard.page.liveStreamsManageTitle", "Live streams")}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {t(
                      "dashboard.page.liveStreamsManageMeta",
                      "Add a Zoom or Google Meet stream and link it to a course",
                    )}
                  </p>
                </Link>
              )}
              <Link
                href="/dashboard/codes"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">
                  {t("dashboard.page.createCodesTitleAdmin", "Create codes")}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {t(
                    "dashboard.page.createCodesMetaAdmin",
                    "Create free activation codes for a course and share them with students",
                  )}
                </p>
              </Link>
            </div>
            {isAdmin ? (
              <div className="mt-5 rounded-full border border-[var(--color-primary)]/35 bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-surface))] px-6 py-3 text-center text-sm font-medium text-[var(--color-foreground)] shadow-[var(--shadow-card)] dark:border-[var(--color-primary)]/45 dark:bg-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-surface))]">
                <p className="text-sm leading-relaxed">
                  {t(
                    "dashboard.page.paymentMethodsHintBefore",
                    "You can edit the payment methods shown to students by clicking ",
                  )}
                  <Link
                    href="/dashboard/settings/add-balance"
                    className="font-semibold text-[var(--color-primary)] underline decoration-[var(--color-primary)]/40 underline-offset-2 hover:decoration-[var(--color-primary)]"
                  >
                    {t("dashboard.page.paymentMethodsHintLink", "here")}
                  </Link>
                  {t("dashboard.page.paymentMethodsHintAfter", ".")}
                </p>
              </div>
            ) : null}
          </div>
          <hr className="border-[var(--color-border)]" />
        </>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t("dashboard.page.studentManagementSectionTitle", "Student management")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/students"
            className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
          >
            <h3 className="font-semibold text-[var(--color-foreground)]">
              {isAdmin
                ? t("dashboard.page.studentsAndAccountsTitle", "Students & accounts")
                : t("dashboard.page.studentsOnlyTitle", "Students")}
            </h3>
            <p className="mt-1 text-3xl font-bold text-[var(--color-primary)]">{studentsCount}</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {t(
                "dashboard.page.studentsAccountsMeta",
                "Manage students, edit accounts, add balance",
              )}
            </p>
          </Link>
          <Link
            href="/dashboard/statistics"
            className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
          >
            <h3 className="font-semibold text-[var(--color-foreground)]">
              {t("dashboard.page.studentStatisticsTitle", "Student statistics")}
            </h3>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className="text-2xl font-bold text-[var(--color-primary)]">{totalEarnings.toFixed(2)}</span>
              <span className="text-sm text-[var(--color-muted)]">
                {t("dashboard.page.earningsSuffix", "EGP earnings")}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {t(
                "dashboard.page.statisticsDetailsMeta",
                "View details, scores, and total earnings",
              )}
            </p>
          </Link>
          {(isAdmin || isAssistant) && (
            <>
              <Link
                href="/dashboard/homework"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">
                  {t("dashboard.page.receiveStudentHomeworkTitle", "Collect student homework")}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {t(
                    "dashboard.page.receiveStudentHomeworkMeta",
                    "View homework submissions and search by student name",
                  )}
                </p>
              </Link>
              <Link
                href="/dashboard/messages"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">
                  {t("dashboard.page.privateMessagesWithStudentsTitle", "Private messaging with students")}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {t(
                    "dashboard.page.privateMessagesWithStudentsMeta",
                    "Chat with a student; send messages, images, or files",
                  )}
                </p>
              </Link>
            </>
          )}
        </div>
      </div>

      {(isAdmin || isAssistant) && (
        <div className="rounded-full border border-[var(--color-primary)]/35 bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-surface))] px-6 py-3 text-center text-sm font-medium text-[var(--color-foreground)] shadow-[var(--shadow-card)] dark:border-[var(--color-primary)]/45 dark:bg-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-surface))]">
          <p className="text-sm leading-relaxed">
            {t(
              "dashboard.page.balanceEditBannerBefore",
              "You can add balance to student accounts and edit their names and passwords from the ",
            )}
            <Link
              href="/dashboard/students"
              className="font-semibold text-[var(--color-primary)] underline decoration-[var(--color-primary)]/40 underline-offset-2 hover:decoration-[var(--color-primary)]"
            >
              {t("dashboard.page.balanceEditBannerLink", "Students")}
            </Link>
            {t("dashboard.page.balanceEditBannerAfter", " page.")}
          </p>
        </div>
      )}

      {isAdmin && (
        <>
          <hr className="border-[var(--color-border)]" />
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
              {t("dashboard.page.customizePlatformSectionTitle", "Customize the platform")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <Link
                href="/dashboard/settings/homepage"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">
                  {t("dashboard.page.homepageSettingsTitleCard", "Homepage settings")}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {t(
                    "dashboard.page.homepageSettingsMeta",
                    "Teacher image, platform name, title, and logo",
                  )}
                </p>
              </Link>
              <Link
                href="/dashboard/reviews"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]/30"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">
                  {t("dashboard.page.studentReviewsTitleCard", "Student reviews")}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {t(
                    "dashboard.page.studentReviewsMeta",
                    "Manage student reviews shown on the homepage (add / edit / delete)",
                  )}
                </p>
              </Link>
            </div>
          </div>

          <hr className="border-[var(--color-border)]" />

          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] sm:text-xl">
              {t(
                "dashboard.page.academyConversionTitle",
                "Turn your personal platform into an academy with multiple teachers and subscription options for published content",
              )}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-muted)]">
              {t(
                "dashboard.page.academyConversionBody",
                "From here you can show teachers on the site and create teacher accounts so each has their own courses on their card—turning a single personal path into an academy where several teachers teach. You can also configure platform subscriptions (weekly, monthly, or yearly) so students access all published paid courses for the subscription period, and manage subscribed students and edit or remove subscription records.",
              )}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/dashboard/teachers"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-primary)]/25 bg-[var(--color-background)] p-6 text-center transition hover:border-[var(--color-primary)]/50 hover:shadow-[var(--shadow-card)]"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">
                  {t("dashboard.page.multiTeachersCardTitle", "Multiple teachers")}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {t(
                    "dashboard.page.multiTeachersCardDesc",
                    "Enable or disable the “Choose teachers” section, create and edit teacher accounts (name, email or phone, subject, photo, password)",
                  )}
                </p>
              </Link>
              <Link
                href="/dashboard/subscriptions"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-primary)]/25 bg-[var(--color-background)] p-6 text-center transition hover:border-[var(--color-primary)]/50 hover:shadow-[var(--shadow-card)]"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">
                  {t("dashboard.page.platformSubsCardTitle", "Platform subscriptions")}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {t(
                    "dashboard.page.platformSubsCardDesc",
                    "Enable the subscriptions section on the homepage, create weekly, monthly, or yearly plans, and tie them to access for all published paid courses",
                  )}
                </p>
              </Link>
              <Link
                href="/dashboard/subscription-students"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-primary)]/25 bg-[var(--color-background)] p-6 text-center transition hover:border-[var(--color-primary)]/50 hover:shadow-[var(--shadow-card)]"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">
                  {t("dashboard.page.subscribedStudentsCardTitle", "Manage subscribed students")}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {t(
                    "dashboard.page.subscribedStudentsCardDesc",
                    "List who subscribed to platform plans and amounts paid, with options to edit subscription end dates or delete records",
                  )}
                </p>
              </Link>
              <Link
                href="/dashboard/library"
                className="flex min-h-[200px] flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-primary)]/25 bg-[var(--color-background)] p-6 text-center transition hover:border-[var(--color-primary)]/50 hover:shadow-[var(--shadow-card)]"
              >
                <h3 className="font-semibold text-[var(--color-foreground)]">
                  {t("dashboard.page.platformLibraryCardTitle", "Platform library")}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {t(
                    "dashboard.page.platformLibraryCardDesc",
                    "Enable or disable the library section and add files, PDF books, and articles (name, description, price, image, category).",
                  )}
                </p>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
