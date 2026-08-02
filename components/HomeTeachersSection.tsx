"use client";

import Link from "next/link";
import { TeacherPublicCard, type TeacherCardCourse } from "@/components/TeacherPublicCard";
import { useT } from "@/components/LocaleProvider";

export type HomeTeacher = {
  id: string;
  name: string;
  teacherSubject: string | null;
  teacherAvatarUrl: string | null;
  createdAt: string;
  courses: TeacherCardCourse[];
};

/** شبكة تتكيّف مع عدد المدربين الظاهرين (1–4) */
function teachersGridClass(count: number): string {
  const base = "mt-10 grid justify-items-center gap-6";
  if (count <= 1) return `${base} mx-auto max-w-xs grid-cols-1`;
  if (count === 2) return `${base} mx-auto max-w-2xl grid-cols-1 sm:grid-cols-2`;
  if (count === 3) return `${base} mx-auto max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`;
  return `${base} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
}

/** Homepage «Choose the trainers» section — only when the feature is enabled. */
export function HomeTeachersSection({
  enabled,
  initialTeachers,
}: {
  enabled: boolean;
  initialTeachers: HomeTeacher[];
}) {
  const t = useT();
  const visible = initialTeachers;

  if (!enabled) return null;

  return (
    <section
      className="home-teachers-hero-blend py-14"
      aria-labelledby="home-teachers-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <h2
            id="home-teachers-heading"
            className="text-4xl font-bold leading-tight text-[var(--color-primary)] sm:text-5xl"
          >
            {t("home.teachersSection.title", "Choose the trainers")}
          </h2>
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
          <p className="mt-3 max-w-xl text-sm text-[var(--color-muted)]">
            {t(
              "home.teachersSection.subtitle",
              "Browse platform trainers and open each trainer’s courses",
            )}
          </p>
        </div>

        {visible.length === 0 ? (
          <p className="mt-14 text-center text-[var(--color-muted)]">
            {t(
              "home.teachersSection.empty",
              "No trainers yet. Create accounts from the dashboard ← Multiple trainers.",
            )}
          </p>
        ) : (
          <>
            <div className={teachersGridClass(visible.length)}>
              {visible.map((teacher) => (
                <TeacherPublicCard
                  key={teacher.id}
                  teacherId={teacher.id}
                  name={teacher.name}
                  teacherSubject={teacher.teacherSubject}
                  teacherAvatarUrl={teacher.teacherAvatarUrl}
                  courses={teacher.courses}
                  titleTag="h3"
                />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/teachers"
                className="text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
              >
                {t("home.teachersSection.viewAll", "Full trainers page →")}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
