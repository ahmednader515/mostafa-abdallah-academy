import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getStudentCoursesWithProgress,
  getStudentDashboardFlags,
} from "@/lib/student-dashboard";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { StudentCourseCard } from "../StudentCourseCard";

export default async function StudentMyCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  const flags = await getStudentDashboardFlags();
  if (!flags.courses) redirect("/dashboard");

  const [t, locale, courses] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getStudentCoursesWithProgress(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t("studentDash.nav.courses", "My courses")}</h2>
      {courses.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          {t("studentDash.noCourses", "You have no courses yet.")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <StudentCourseCard
              key={c.id}
              course={c}
              locale={locale}
              continueLabel={t("studentDash.continue", "Continue learning")}
              instructorLabel={t("studentDash.instructor", "Instructor")}
              lastLessonLabel={t("studentDash.lastLesson", "Last lesson")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
