"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";

export type CurriculumLesson = {
  id: string;
  title: string;
  href: string;
  durationLabel?: string | null;
  isPreview: boolean;
  sectionId: string | null;
  locked: boolean;
};

export type CurriculumSection = {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
};

type Props = {
  freeTitle: string;
  paidTitle: string;
  freeLessons: CurriculumLesson[];
  paidSections: CurriculumSection[];
  extraSectionTitle: string;
  lockedLabel: string;
  previewLabel: string;
  lessonWord: string;
  sectionsWord: string;
};

function AccordionShell({
  title,
  countLabel,
  defaultOpen,
  children,
}: {
  title: string;
  countLabel: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-start transition hover:bg-[var(--color-border)]/20"
        aria-expanded={open}
      >
        <div>
          <p className="font-semibold text-[var(--color-foreground)]">{title}</p>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">{countLabel}</p>
        </div>
        <span className="text-[var(--color-muted)]" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? <div className="border-t border-[var(--color-border)] px-2 py-2 sm:px-3">{children}</div> : null}
    </div>
  );
}

function LessonRow({
  lesson,
  previewLabel,
  lockedLabel,
}: {
  lesson: CurriculumLesson;
  previewLabel: string;
  lockedLabel: string;
}) {
  const inner = (
    <>
      <span className="mt-0.5 text-[var(--color-muted)]" aria-hidden>
        {lesson.locked ? "🔒" : lesson.isPreview ? "▶" : "○"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[var(--color-foreground)]">{lesson.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
          {lesson.isPreview ? <span className="text-[var(--color-primary)]">{previewLabel}</span> : null}
          {lesson.durationLabel ? <span>{lesson.durationLabel}</span> : null}
          {lesson.locked ? <span>{lockedLabel}</span> : null}
        </span>
      </span>
    </>
  );

  if (lesson.locked) {
    return (
      <li className="flex items-start gap-3 rounded-[var(--radius-btn)] px-2 py-2.5 opacity-80 sm:px-3">
        {inner}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={lesson.href}
        className="flex items-start gap-3 rounded-[var(--radius-btn)] px-2 py-2.5 transition hover:bg-[var(--color-border)]/30 sm:px-3"
      >
        {inner}
      </Link>
    </li>
  );
}

export function CourseCurriculumAccordions({
  freeTitle,
  paidTitle,
  freeLessons,
  paidSections,
  extraSectionTitle,
  lockedLabel,
  previewLabel,
  lessonWord,
  sectionsWord,
}: Props) {
  const paidLessonCount = paidSections.reduce((n, s) => n + s.lessons.length, 0);
  const sectionsForPaid =
    paidSections.length > 0
      ? paidSections
      : paidLessonCount === 0
        ? []
        : [{ id: "extra", title: extraSectionTitle, lessons: [] as CurriculumLesson[] }];

  const hasFree = freeLessons.length > 0;
  const hasPaid = paidLessonCount > 0 || paidSections.length > 0;

  if (!hasFree && !hasPaid) return null;

  return (
    <div className="space-y-4">
      {hasFree ? (
        <AccordionShell
          title={freeTitle}
          countLabel={`${freeLessons.length} ${lessonWord}`}
          defaultOpen
        >
          <ul className="space-y-0.5">
            {freeLessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                previewLabel={previewLabel}
                lockedLabel={lockedLabel}
              />
            ))}
          </ul>
        </AccordionShell>
      ) : null}

      {hasPaid ? (
        <AccordionShell
          title={paidTitle}
          countLabel={`${sectionsForPaid.length} ${sectionsWord} — ${paidLessonCount} ${lessonWord}`}
          defaultOpen={!hasFree}
        >
          <div className="space-y-3">
            {paidSections.map((section) => (
              <div key={section.id} className="rounded-[var(--radius-btn)] bg-[var(--color-background)]/60 p-2 sm:p-3">
                <div className="mb-1 flex items-center justify-between gap-2 px-1">
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{section.title}</h3>
                  <span className="text-xs text-[var(--color-muted)]">
                    {section.lessons.length} {lessonWord}
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {section.lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      previewLabel={previewLabel}
                      lockedLabel={lockedLabel}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </AccordionShell>
      ) : null}
    </div>
  );
}
