"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useT } from "@/components/LocaleProvider";

export type ExamListItem = {
  quizId: string;
  quizTitle: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  questionCount: number;
  timeLimitMinutes: number | null;
  passingScore: number | null;
  canAccess: boolean;
  href: string;
  courseHref: string;
};

export function ExamsBrowseClient({
  items,
  isLoggedIn,
  isStudent,
}: {
  items: ExamListItem[];
  isLoggedIn: boolean;
  isStudent: boolean;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "accessible">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "accessible" && !item.canAccess) return false;
      if (!q) return true;
      return (
        item.quizTitle.toLowerCase().includes(q) ||
        item.courseTitle.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  const accessibleCount = items.filter((i) => i.canAccess).length;

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("exams.searchPlaceholder", "Search exams or courses…")}
          className="w-full flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)]"
        />
        {isLoggedIn && isStudent ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-[var(--radius-btn)] px-4 py-2 text-sm font-medium ${
                filter === "all"
                  ? "bg-[var(--color-primary)] text-white"
                  : "border border-[var(--color-border)] text-[var(--color-foreground)]"
              }`}
            >
              {t("exams.filterAll", "All")} ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("accessible")}
              className={`rounded-[var(--radius-btn)] px-4 py-2 text-sm font-medium ${
                filter === "accessible"
                  ? "bg-[var(--color-primary)] text-white"
                  : "border border-[var(--color-border)] text-[var(--color-foreground)]"
              }`}
            >
              {t("exams.filterMine", "Available to me")} ({accessibleCount})
            </button>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
          <p className="text-[var(--color-muted)]">
            {items.length === 0
              ? t("exams.empty", "No exams published yet.")
              : t("exams.noResults", "No exams match your search.")}
          </p>
          <Link
            href="/courses"
            className="mt-6 inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
          >
            {t("exams.browseCourses", "Browse courses")}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {filtered.map((item) => (
            <li
              key={item.quizId}
              className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
            >
              <div className="h-1.5 w-full bg-gradient-to-l from-[#F59E0B] via-[#2563EB] to-[#0F172A]" />
              <div className="p-5">
                <p className="text-xs font-medium text-[var(--color-muted)]">{item.courseTitle}</p>
                <h2 className="mt-1 text-lg font-bold text-[var(--color-foreground)]">{item.quizTitle}</h2>
                <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
                  <div>
                    {t("exams.questions", "Questions")}:{" "}
                    <span className="font-semibold text-[var(--color-foreground)]">{item.questionCount}</span>
                  </div>
                  {item.timeLimitMinutes != null ? (
                    <div>
                      {t("exams.timeLimit", "Time")}:{" "}
                      <span className="font-semibold text-[var(--color-foreground)]">
                        {item.timeLimitMinutes} {t("exams.minutes", "min")}
                      </span>
                    </div>
                  ) : null}
                  {item.passingScore != null ? (
                    <div>
                      {t("exams.passingScore", "Pass")}:{" "}
                      <span className="font-semibold text-[var(--color-accent)]">{item.passingScore}%</span>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.canAccess ? (
                    <Link
                      href={item.href}
                      className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
                    >
                      {t("exams.startExam", "Start exam")}
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={item.courseHref}
                        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
                      >
                        {!isLoggedIn
                          ? t("exams.loginOrEnroll", "View course / enroll")
                          : t("exams.enrollFirst", "Enroll to unlock")}
                      </Link>
                      <span className="self-center text-xs text-[var(--color-muted)]">
                        {t("exams.lockedHint", "Requires course access")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
