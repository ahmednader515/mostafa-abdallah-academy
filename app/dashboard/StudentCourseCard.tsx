import Image from "next/image";
import Link from "next/link";
import { ProgressCircle } from "@/components/ProgressCircle";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import type { Locale } from "@/lib/i18n/types";
import type { StudentCourseCardData } from "@/lib/student-dashboard";

export function StudentCourseCard({
  course,
  locale,
  continueLabel,
  instructorLabel,
  lastLessonLabel,
}: {
  course: StudentCourseCardData;
  locale: Locale;
  continueLabel: string;
  instructorLabel: string;
  lastLessonLabel: string;
}) {
  const title = pickLocalizedText(locale, course.titleAr, course.title);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div className="relative aspect-[16/9] bg-[var(--color-border)]/40">
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 33vw"
            unoptimized
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug">{title}</h3>
            {course.instructorName ? (
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {instructorLabel}: {course.instructorName}
              </p>
            ) : null}
            {course.lastLessonTitle ? (
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {lastLessonLabel}: {course.lastLessonTitle}
              </p>
            ) : null}
          </div>
          <ProgressCircle percent={course.percent} size={56} />
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          {course.completedLessons}/{course.totalLessons}
        </p>
        <Link
          href={course.continueHref}
          className="mt-auto inline-flex justify-center rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          {continueLabel}
        </Link>
      </div>
    </article>
  );
}
