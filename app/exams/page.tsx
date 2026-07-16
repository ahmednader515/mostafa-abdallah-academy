import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasFullCourseAccessAsStudent } from "@/lib/db";
import { listPublishedExams } from "@/lib/forum-db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { ExamsBrowseClient } from "./ExamsBrowseClient";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const [t, locale, session] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getServerSession(authOptions),
  ]);

  const exams = await listPublishedExams().catch(() => []);

  const accessMap: Record<string, boolean> = {};
  const role = session?.user?.role;
  const userId = session?.user?.id;

  if (role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER") {
    for (const e of exams) accessMap[e.courseId] = true;
  } else if (userId && role === "STUDENT") {
    const uniqueCourseIds = [...new Set(exams.map((e) => e.courseId))];
    await Promise.all(
      uniqueCourseIds.map(async (cid) => {
        accessMap[cid] = await hasFullCourseAccessAsStudent(userId, cid).catch(() => false);
      }),
    );
  }

  const items = exams.map((e) => {
    const courseTitle = pickLocalizedText(locale, e.courseTitleAr, e.courseTitle);
    return {
      quizId: e.quizId,
      quizTitle: e.quizTitle,
      courseId: e.courseId,
      courseTitle,
      courseSlug: e.courseSlug,
      questionCount: e.questionCount,
      timeLimitMinutes: e.timeLimitMinutes,
      passingScore: e.passingScore,
      canAccess: !!accessMap[e.courseId],
      href: e.courseSlug
        ? `/courses/${encodeURIComponent(e.courseSlug)}/quizzes/${encodeURIComponent(e.quizId)}`
        : `/courses/${encodeURIComponent(e.courseId)}/quizzes/${encodeURIComponent(e.quizId)}`,
      courseHref: e.courseSlug
        ? `/courses/${encodeURIComponent(e.courseSlug)}`
        : `/courses/${encodeURIComponent(e.courseId)}`,
    };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
            {t("exams.pageTitle", "Exams")}
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
            {t(
              "exams.pageSubtitle",
              "Browse all quizzes linked to published courses. Open an exam if you have access, or enroll in the course first.",
            )}
          </p>
        </div>
        <Link
          href="/courses"
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/40"
        >
          {t("common.courses", "Courses")}
        </Link>
      </div>

      <ExamsBrowseClient
        items={items}
        isLoggedIn={!!session}
        isStudent={role === "STUDENT"}
      />
    </div>
  );
}
