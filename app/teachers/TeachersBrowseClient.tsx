"use client";

import { useMemo, useState } from "react";
import { TeacherPublicCard, type TeacherCardCourse } from "@/components/TeacherPublicCard";
import { useLocale, useT } from "@/components/LocaleProvider";

export type TeacherPublic = {
  id: string;
  name: string;
  teacherSubject: string | null;
  teacherAvatarUrl: string | null;
  courses: TeacherCardCourse[];
};

function normalizeSearch(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function TeachersBrowseClient({ initialTeachers }: { initialTeachers: TeacherPublic[] }) {
  const t = useT();
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");

  const sortedByName = useMemo(
    () =>
      [...initialTeachers].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", locale === "ar" ? "ar" : "en"),
      ),
    [initialTeachers, locale],
  );

  const filtered = useMemo(() => {
    const q = normalizeSearch(searchQuery);
    if (!q) return sortedByName;
    return sortedByName.filter((teacher) => {
      const name = (teacher.name ?? "").toLowerCase();
      const sub = (teacher.teacherSubject ?? "").toLowerCase();
      const inCourse = (teacher.courses ?? []).some((c) =>
        (c.title ?? "").toLowerCase().includes(q),
      );
      return name.includes(q) || sub.includes(q) || inCourse;
    });
  }, [sortedByName, searchQuery]);

  return (
    <div className="min-h-[60vh] py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold leading-tight text-[var(--color-primary)] sm:text-5xl">
            {t("home.teachersSection.title", "Choose the trainers")}
          </h1>
          <svg
            className="mt-3 h-8 w-[17.5rem] text-[var(--color-primary)] sm:h-9 sm:w-[21rem] md:w-[26rem]"
            viewBox="0 0 200 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M4 20 Q 100 3 196 20"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted)]">
            {t(
              "teachers.browseSubtitle",
              "Browse platform trainers, search by name or specialty, then open each trainer’s courses.",
            )}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-xl">
          <label htmlFor="teachers-search" className="sr-only">
            {t("teachers.searchLabel", "Search trainers")}
          </label>
          <input
            id="teachers-search"
            type="search"
            dir="auto"
            autoComplete="off"
            placeholder={t("teachers.searchPlaceholder", "Search by trainer name or subject…")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)] shadow-[var(--shadow-card)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25"
          />
        </div>

        {initialTeachers.length === 0 ? (
          <p className="mt-16 text-center text-[var(--color-muted)]">
            {t(
              "teachers.empty",
              "No trainers on the platform yet. An admin can add trainer accounts from the dashboard.",
            )}
          </p>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-[var(--color-muted)]">
            {t(
              "teachers.noResults",
              "No results match your search. Try other words or clear the field.",
            )}
          </p>
        ) : (
          <div className="mt-10 grid justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((teacher) => (
              <TeacherPublicCard
                key={teacher.id}
                teacherId={teacher.id}
                name={teacher.name}
                teacherSubject={teacher.teacherSubject}
                teacherAvatarUrl={teacher.teacherAvatarUrl}
                courses={teacher.courses}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
