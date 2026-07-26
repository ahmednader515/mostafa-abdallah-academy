import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getUsersByRole,
  getEnrollmentsWithCourseByUserId,
  getCoursesPublished,
  backfillMissingStudentCopyrightCodes,
  listUserPlatformSubscriptionsForAdmin,
} from "@/lib/db";
import { ensureUserExtraColumns } from "@/lib/dashboard-overview";
import { getServerTranslator } from "@/lib/i18n/server";
import { StudentsList } from "./StudentsList";
import { StaffAccountsSection } from "./StaffAccountsSection";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();

  const isAdmin = session.user.role === "ADMIN";
  const isAssistant = session.user.role === "ASSISTANT_ADMIN";

  await backfillMissingStudentCopyrightCodes().catch(() => {});
  await ensureUserExtraColumns().catch(() => {});

  const [rows, coursesList, allSubs] = await Promise.all([
    getUsersByRole("STUDENT"),
    getCoursesPublished(true),
    listUserPlatformSubscriptionsForAdmin().catch(() => []),
  ]);

  let admins: Awaited<ReturnType<typeof getUsersByRole>> = [];
  let assistantAdmins: Awaited<ReturnType<typeof getUsersByRole>> = [];
  if (isAdmin) {
    [admins, assistantAdmins] = await Promise.all([
      getUsersByRole("ADMIN"),
      getUsersByRole("ASSISTANT_ADMIN"),
    ]);
  }

  const activeSubByUser = new Map<string, string>();
  for (const sub of allSubs) {
    if (sub.isActive && !activeSubByUser.has(sub.userId)) {
      activeSubByUser.set(sub.userId, sub.planName ?? "Subscription");
    }
  }

  const enrollmentsByUser = await Promise.all(rows.map((s) => getEnrollmentsWithCourseByUserId(s.id)));

  const students = rows.map((s, i) => {
    const row = s as unknown as Record<string, unknown>;
    const lastLogin = row.last_login_at ?? (s as { last_login_at?: Date | string | null }).last_login_at;
    return {
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    balance: Number(s.balance),
    student_number: s.student_number ?? null,
    guardian_number: s.guardian_number ?? null,
    copyright_code: (row.copyright_code as string | null | undefined) ?? (s as { copyright_code?: string | null }).copyright_code ?? null,
    isSuspended: Boolean(row.is_suspended ?? (s as { is_suspended?: boolean }).is_suspended),
    createdAt: s.created_at instanceof Date ? s.created_at.toISOString() : String(s.created_at ?? ""),
    lastLoginAt: lastLogin
      ? lastLogin instanceof Date
        ? lastLogin.toISOString()
        : String(lastLogin)
      : null,
    currentSubscription: activeSubByUser.get(s.id) ?? null,
    _count: { enrollments: enrollmentsByUser[i].length },
    enrollments: enrollmentsByUser[i].map((e) => ({
      id: e.id,
      courseId: e.course_id,
      course: { id: e.course.id, title: e.course.title, titleAr: e.course.titleAr, slug: e.course.slug },
    })),
    };
  });

  const coursesPlain = coursesList.map((c) => {
    const row = c as unknown as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      title: String(row.title ?? ""),
      titleAr: (row.titleAr != null ? String(row.titleAr) : null) as string | null,
      slug: String(row.slug ?? ""),
    };
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          {isAdmin
            ? t("dashboard.studentsPage.pageTitleAccounts", "Students & accounts")
            : t("dashboard.studentsPage.pageTitleStudentsOnly", "Student list")}
        </h2>
        <a
          href="/api/dashboard/students/export"
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-primary)] hover:text-white"
        >
          {t("dashboard.studentsPage.exportExcel", "Export Excel (CSV)")}
        </a>
      </div>
      {isAdmin && (
        <StaffAccountsSection
          admins={admins.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }))}
          assistantAdmins={assistantAdmins.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }))}
        />
      )}
      <div className={isAdmin ? "mt-8" : ""}>
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t("dashboard.studentsPage.studentListHeading", "Student list")}
        </h3>
        <StudentsList
          students={students}
          courses={coursesPlain}
          isAdmin={isAdmin}
          canAddBalance={isAdmin || isAssistant}
          canManageEnrollments={isAdmin}
          canEditFullProfile={isAdmin}
        />
      </div>
    </div>
  );
}
