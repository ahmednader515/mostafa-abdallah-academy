import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ProgressCircle } from "@/components/ProgressCircle";
import {
  getStudentCoursesWithProgress,
  getStudentDashboardFlags,
} from "@/lib/student-dashboard";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export default async function StudentProgressPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  const flags = await getStudentDashboardFlags();
  if (!flags.progress) redirect("/dashboard");

  const [t, locale, courses] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getStudentCoursesWithProgress(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t("studentDash.nav.progress", "Progress")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => {
          const title = pickLocalizedText(locale, c.titleAr, c.title);
          return (
            <div
              key={c.id}
              className="flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center"
            >
              <ProgressCircle percent={c.percent} size={100} label={title} />
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                {t("studentDash.completedLessons", "Completed")}: {c.completedLessons} ·{" "}
                {t("studentDash.remainingLessons", "Remaining")}: {c.remainingLessons}
              </p>
              {c.lastLessonTitle ? (
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {t("studentDash.lastLesson", "Last lesson")}: {c.lastLessonTitle}
                </p>
              ) : null}
              <Link href={c.continueHref} className="mt-3 text-sm font-medium underline">
                {t("studentDash.continue", "Continue learning")}
              </Link>
            </div>
          );
        })}
      </div>
      {courses.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          {t("studentDash.noCourses", "You have no courses yet.")}
        </p>
      ) : null}
    </div>
  );
}
