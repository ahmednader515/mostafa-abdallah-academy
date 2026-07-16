import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseWithContent,
  getEnrollment,
  hasFullCourseAccessAsStudent,
  getCourseProgressForUser,
} from "@/lib/db";
import { getCertificatesForUser } from "@/lib/lms-spec-db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

type Props = { params: Promise<{ slug: string }> };

function decodeSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function courseSeg(course: { slug?: string | null; id: string }): string {
  const s = course.slug && course.slug.trim() ? String(course.slug).trim() : "";
  const normalized = s ? s.replace(/-+$/, "").replace(/^-+/, "") : "";
  return normalized ? encodeURIComponent(normalized) : course.id;
}

export default async function CourseCompletePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const { slug } = await params;
  const courseDecoded = decodeSegment(slug);

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/courses/${encodeURIComponent(slug)}/complete`);
  }

  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const data = await getCourseWithContent(courseDecoded);
  if (!data?.course) notFound();

  const course = data.course as { id: string; slug?: string | null; title?: string; titleAr?: string | null };
  const isStaff = session.user.role === "ADMIN" || session.user.role === "ASSISTANT_ADMIN";
  let canAccess = isStaff;
  if (!canAccess) {
    const enrolled = await getEnrollment(session.user.id, course.id);
    const full = session.user.role === "STUDENT" ? await hasFullCourseAccessAsStudent(session.user.id, course.id) : false;
    canAccess = !!enrolled || full;
  }
  if (!canAccess) notFound();

  const lessons = data.lessons.map((l) => ({ id: String(l.id) }));
  const quizzes = (data.quizzes ?? []).map((q) => ({ id: String(q.id) }));
  const progress = await getCourseProgressForUser(session.user.id, course.id, lessons, quizzes);

  if (!progress.isComplete && !isStaff) {
    redirect(`/courses/${courseSeg(course)}`);
  }

  const courseTitle =
    pickLocalizedText(
      locale,
      course.titleAr != null ? String(course.titleAr) : null,
      course.title != null ? String(course.title) : null,
    ) ||
    String(course.title ?? course.titleAr ?? "");

  let certificateHref: string | null = null;
  try {
    const certs = await getCertificatesForUser(session.user.id);
    const forCourse = certs.find((c) => c.courseId === course.id);
    if (forCourse) certificateHref = `/certificates/${encodeURIComponent(forCourse.id)}`;
  } catch {
    /* ignore */
  }

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgb(37 99 235 / 0.14), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgb(245 158 11 / 0.12), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F59E0B] text-white shadow-lg shadow-amber-500/30">
        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-[#2563EB]">
        {t("courses.completeEyebrow", "Course completed")}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold text-[var(--color-foreground)] sm:text-4xl">
        {t("courses.completeTitle", "Congratulations!")}
      </h1>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--color-muted)]">
        {t("courses.completeBody", "You've successfully finished")}{" "}
        <span className="font-semibold text-[var(--color-foreground)]">{courseTitle}</span>
        {t("courses.completeBodySuffix", ". Great work — keep learning and growing.")}
      </p>

      <div className="mt-6 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-4 py-1.5 text-sm font-medium text-[#2563EB]">
        {t("courses.progressLabel", "Progress")}: 100% · {progress.completedItems}/{progress.totalItems}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {certificateHref ? (
          <Link
            href={certificateHref}
            className="rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
          >
            {t("courses.viewCertificate", "View your certificate")}
          </Link>
        ) : null}
        <Link
          href="/certificates"
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-background)]"
        >
          {t("courses.allCertificates", "My certificates")}
        </Link>
        <Link
          href="/courses"
          className="rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          {t("courses.browseMore", "Browse more courses")}
        </Link>
      </div>

      <Link
        href={`/courses/${courseSeg(course)}`}
        className="mt-8 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:underline"
      >
        ← {t("courses.backToCourse", "Back to course")}
      </Link>
    </div>
  );
}
