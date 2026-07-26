import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getStudentDashboardFlags, getStudentHomework } from "@/lib/student-dashboard";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function StudentHomeworkPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  const flags = await getStudentDashboardFlags();
  if (!flags.homework) redirect("/dashboard");

  const [t, items] = await Promise.all([
    getServerTranslator(),
    getStudentHomework(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t("studentDash.nav.homework", "Homework")}</h2>
      <p className="text-sm text-[var(--color-muted)]">
        {t(
          "studentDash.homeworkHint",
          "Submit PDF, image, or link from the lesson page. Open a task to continue.",
        )}
      </p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={`${item.lessonId}-${item.submissionId ?? "p"}`}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.lessonTitle}</p>
                <p className="text-xs text-[var(--color-muted)]">{item.courseTitle}</p>
                <p className="mt-2 text-sm">
                  {t("studentDash.hwStatus", "Status")}:{" "}
                  {item.status === "pending"
                    ? t("studentDash.hwPending", "Not submitted")
                    : t("studentDash.hwSubmitted", "Submitted")}
                </p>
                {item.submittedAt ? (
                  <p className="text-xs text-[var(--color-muted)]">
                    {t("studentDash.date", "Date")}: {item.submittedAt.slice(0, 10)}
                  </p>
                ) : null}
                {item.grade != null ? (
                  <p className="text-sm">
                    {t("studentDash.grade", "Grade")}: {item.grade}
                  </p>
                ) : null}
                {item.feedback ? (
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{item.feedback}</p>
                ) : null}
              </div>
              <Link
                href={item.href}
                className="rounded bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white"
              >
                {item.status === "pending"
                  ? t("studentDash.submitHw", "Submit")
                  : t("studentDash.openLesson", "Open lesson")}
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          {t("studentDash.noHomework", "No homework tasks found.")}
        </p>
      ) : null}
    </div>
  );
}
