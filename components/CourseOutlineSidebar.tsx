import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";

function courseSeg(course: { slug?: string | null; id: string }): string {
  const s = course.slug && course.slug.trim() ? String(course.slug).trim() : "";
  const normalized = s ? s.replace(/-+$/, "").replace(/^-+/, "") : "";
  return normalized ? encodeURIComponent(normalized) : (course as { id: string }).id;
}

function lessonHref(course: { slug?: string | null; id: string }, lesson: { slug?: string | null; id: string }): string {
  const seg = courseSeg(course);
  const lessonSeg = lesson.slug && lesson.slug.trim() ? encodeURIComponent(lesson.slug.trim()) : lesson.id;
  return `/courses/${seg}/lessons/${lessonSeg}`;
}

function quizHref(course: { slug?: string | null; id: string }, quizId: string): string {
  return `/courses/${courseSeg(course)}/quizzes/${encodeURIComponent(quizId)}`;
}

type Props = {
  course: { id: string; slug?: string | null };
  lessons: Array<Record<string, unknown> & { id: string; title?: string; titleAr?: string | null; order?: number }>;
  quizzes: Array<Record<string, unknown> & { id: string; title?: string; order?: number; _count?: { questions?: number } }>;
  currentLessonId?: string | null;
  currentQuizId?: string | null;
  completedLessonIds?: string[];
  passedQuizIds?: string[];
  progressPercent?: number;
};

export async function CourseOutlineSidebar({
  course,
  lessons,
  quizzes,
  currentLessonId,
  currentQuizId,
  completedLessonIds = [],
  passedQuizIds = [],
  progressPercent,
}: Props) {
  const t = await getServerTranslator();
  const lessonOrder = (l: { order?: number }) => (typeof l.order === "number" ? l.order : 999);
  const quizOrder = (q: { order?: number }) => (typeof q.order === "number" ? q.order : 999);
  const items = [
    ...lessons.map((l) => ({ type: "lesson" as const, order: lessonOrder(l), data: l })),
    ...quizzes.map((q) => ({ type: "quiz" as const, order: quizOrder(q), data: q })),
  ].sort((a, b) => a.order - b.order);

  const doneLessons = new Set(completedLessonIds);
  const doneQuizzes = new Set(passedQuizIds);
  const total = items.length;
  const doneCount = items.filter((item) =>
    item.type === "lesson" ? doneLessons.has(item.data.id) : doneQuizzes.has(item.data.id),
  ).length;
  const percent =
    typeof progressPercent === "number"
      ? progressPercent
      : total > 0
        ? Math.round((doneCount / total) * 100)
        : 0;

  return (
    <div className="sticky top-24 w-full max-w-[220px] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-card)]">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {t("courses.courseContent", "Course content")}
      </h2>

      {total > 0 ? (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
            <span className="font-medium text-[var(--color-foreground)]">
              {t("courses.progressLabel", "Progress")}
            </span>
            <span className="tabular-nums text-[var(--color-muted)]">
              {percent}% · {doneCount}/{total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
        </div>
      ) : null}

      <ul className="space-y-0.5">
        {items.map((item, i) => {
          if (item.type === "lesson") {
            const l = item.data;
            const isCurrent = l.id === currentLessonId;
            const isDone = doneLessons.has(l.id);
            const title = String((l as Record<string, unknown>).titleAr ?? (l as Record<string, unknown>).title ?? "");
            return (
              <li key={`l-${l.id}`}>
                <Link
                  href={lessonHref(course, l)}
                  className={`flex items-start gap-1.5 rounded-[var(--radius-btn)] px-2 py-1.5 text-xs transition ${
                    isCurrent
                      ? "bg-[var(--color-primary)]/15 font-medium text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30"
                      : "text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                      isDone
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-[var(--color-border)] text-[var(--color-muted)]"
                    }`}
                    aria-hidden
                  >
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span className={isDone && !isCurrent ? "text-[var(--color-muted)]" : undefined}>{title}</span>
                </Link>
              </li>
            );
          }
          const q = item.data;
          const isCurrent = q.id === currentQuizId;
          const isDone = doneQuizzes.has(q.id);
          const title = String((q as Record<string, unknown>).title ?? "");
          const qCount = (q as { _count?: { questions?: number } })._count;
          const count =
            qCount != null && typeof qCount === "object" && "questions" in qCount ? Number(qCount.questions) || 0 : 0;
          return (
            <li key={`q-${q.id}`}>
              <Link
                href={quizHref(course, q.id)}
                className={`flex items-start gap-1.5 rounded-[var(--radius-btn)] px-2 py-1.5 text-xs transition ${
                  isCurrent
                    ? "bg-[var(--color-primary)]/15 font-medium text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30"
                    : "text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                    isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-[var(--color-border)] text-[var(--color-muted)]"
                  }`}
                  aria-hidden
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <span className={isDone && !isCurrent ? "text-[var(--color-muted)]" : undefined}>
                  <span className="text-[var(--color-muted)]">{t("courses.testPrefix", "Quiz:")} </span>
                  {title}
                  {count > 0 ? (
                    <span className="ms-0.5 text-[10px] text-[var(--color-muted)]">({count})</span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
