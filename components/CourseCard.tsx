"use client";

import Link from "next/link";
import { FormattedPrice } from "./FormattedPrice";
import { useLocale, useT } from "./LocaleProvider";

function normalizeCoursePrice(
  price: number | { toNumber?: () => number } | string | undefined,
): number | null {
  if (price === undefined || price === null || price === "") return null;
  if (typeof price === "object" && price !== null && typeof price.toNumber === "function") {
    const n = price.toNumber();
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(price);
  return Number.isFinite(n) ? n : null;
}

type Course = {
  id: string;
  title: string;
  titleAr?: string | null;
  slug?: string | null;
  shortDesc?: string | null;
  shortDescEn?: string | null;
  duration?: string | null;
  level?: string | null;
  imageUrl?: string | null;
  price?: number | { toNumber?: () => number } | string;
  courseRating?: number | { toNumber?: () => number } | string | null;
  courseRatingCount?: number | { toNumber?: () => number } | string | null;
  lessonsCount?: number | null;
  instructorName?: string | null;
  category?: { name: string; nameAr?: string | null } | null;
};

export function CourseCard({ course }: { course: Course }) {
  const locale = useLocale();
  const t = useT();
  const displayTitle = locale === "en" ? (course.title || course.titleAr) : (course.titleAr || course.title);
  const categoryName =
    locale === "en"
      ? (course.category?.name || course.category?.nameAr)
      : (course.category?.nameAr || course.category?.name);
  const shortDescription =
    locale === "en" ? (course.shortDescEn || course.shortDesc) : (course.shortDesc || course.shortDescEn);
  const slugOrId = (course.slug && course.slug.trim()) ? encodeURIComponent(course.slug.trim()) : course.id;
  const href = slugOrId ? `/courses/${slugOrId}` : "/courses";
  const priceValue = normalizeCoursePrice(course.price);
  const courseRatingValue = normalizeCoursePrice(course.courseRating ?? undefined);
  const courseRatingCountValue = normalizeCoursePrice(course.courseRatingCount ?? undefined);
  const hasCourseRating =
    courseRatingValue !== null &&
    courseRatingValue > 0 &&
    courseRatingCountValue !== null &&
    courseRatingCountValue > 0;
  const isPaid = priceValue !== null && priceValue > 0;
  const lessonsCount = course.lessonsCount != null ? Number(course.lessonsCount) : null;

  return (
    <article className="flex w-[min(86vw,18rem)] shrink-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition hover:border-[var(--color-primary)]/30 hover:shadow-[var(--shadow-hover)] sm:w-72">
      <Link href={href} className="group block">
        <div className="aspect-video w-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary-light)]/30 flex items-center justify-center">
          {course.imageUrl ? (
            <img
              src={course.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-4xl opacity-50">📚</span>
          )}
        </div>
        <div className="p-5 pb-3">
          {categoryName && (
            <span className="text-xs font-medium text-[var(--color-primary)]">
              {categoryName}
            </span>
          )}
          <h3 className="mt-1 text-lg font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]">
            {displayTitle}
          </h3>
          {shortDescription && (
            <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">
              {shortDescription}
            </p>
          )}
          {course.instructorName ? (
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              {t("courses.instructorLabel", "Instructor")}:{" "}
              <span className="font-medium text-[var(--color-foreground)]">{course.instructorName}</span>
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {lessonsCount != null && lessonsCount >= 0 ? (
              <span className="rounded-full bg-[var(--color-primary-light)]/55 px-2.5 py-1 text-xs text-[var(--color-primary)]">
                {t("courses.lecturesCountLabel", "{count} lectures").replace(
                  "{count}",
                  String(lessonsCount),
                )}
              </span>
            ) : null}
            {course.duration && (
              <span className="rounded-full bg-[var(--color-primary-light)]/55 px-2.5 py-1 text-xs text-[var(--color-primary)]">
                ⏱ {course.duration}
              </span>
            )}
            {course.level && (
              <span className="rounded-full bg-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-muted)]">
                {course.level === "beginner" && t("common.beginner", "Beginner")}
                {course.level === "intermediate" && t("common.intermediate", "Intermediate")}
                {course.level === "advanced" && t("common.advanced", "Advanced")}
                {course.level !== "beginner" &&
                  course.level !== "intermediate" &&
                  course.level !== "advanced" &&
                  course.level}
              </span>
            )}
            {hasCourseRating ? (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                ★ {courseRatingValue.toFixed(1)} ({Math.round(courseRatingCountValue)})
              </span>
            ) : null}
          </div>
          <div className="mt-3">
            {isPaid && priceValue !== null ? (
              <FormattedPrice amountEgp={priceValue} variant="badge" />
            ) : (
              <span className="inline-flex items-center rounded-[var(--radius-btn)] border border-[var(--color-success)]/35 bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-surface))] px-2.5 py-2 text-xs font-semibold text-[var(--color-success)]">
                {t("common.free", "Free")}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="mt-auto flex gap-2 border-t border-[var(--color-border)] p-3">
        <Link
          href={href}
          className="flex-1 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-2 text-center text-xs font-semibold text-white hover:opacity-90"
        >
          {t("courses.startCourse", "Start course")}
        </Link>
        <Link
          href={href}
          className="flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-center text-xs font-semibold text-[var(--color-foreground)] hover:border-[var(--color-primary)]/40"
        >
          {t("courses.viewDetails", "View details")}
        </Link>
      </div>
    </article>
  );
}
