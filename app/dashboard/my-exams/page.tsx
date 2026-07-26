import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getQuizAttemptsByUserId } from "@/lib/db";
import { getStudentDashboardFlags } from "@/lib/student-dashboard";
import { getServerTranslator } from "@/lib/i18n/server";
import { sql } from "@/lib/db";

export default async function StudentExamsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  const flags = await getStudentDashboardFlags();
  if (!flags.exams) redirect("/dashboard");

  const t = await getServerTranslator();
  const attempts = await getQuizAttemptsByUserId(session.user.id).catch(() => []);
  let certificates: { id: string; title: string }[] = [];
  try {
    const rows = await sql`
      SELECT id, course_title FROM "Certificate"
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC LIMIT 50
    `;
    certificates = (rows as { id: string; course_title: string }[]).map((r) => ({
      id: String(r.id),
      title: String(r.course_title ?? "Certificate"),
    }));
  } catch {
    certificates = [];
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("studentDash.nav.exams", "Exams & certs")}</h2>
        <div className="flex gap-3 text-sm">
          <Link href="/exams" className="underline">
            {t("studentDash.availableExams", "Available exams")}
          </Link>
          <Link href="/certificates" className="underline">
            {t("studentDash.allCertificates", "All certificates")}
          </Link>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("studentDash.pastAttempts", "Past quiz attempts")}</h3>
        <ul className="space-y-2 text-sm">
          {attempts.map((a, i) => {
            const pct =
              a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 100) : 0;
            return (
              <li
                key={`${a.quizTitle}-${i}`}
                className="flex flex-wrap justify-between gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3"
              >
                <span>
                  {a.quizTitle} · {a.courseTitle}
                </span>
                <span className="tabular-nums text-[var(--color-muted)]">
                  {a.score}/{a.totalQuestions} ({pct}%)
                </span>
              </li>
            );
          })}
          {attempts.length === 0 ? (
            <li className="text-[var(--color-muted)]">{t("studentDash.noAttempts", "No attempts yet.")}</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("studentDash.certificates", "Certificates")}</h3>
        <ul className="space-y-2 text-sm">
          {certificates.map((c) => (
            <li key={c.id} className="flex justify-between gap-2 rounded-xl border px-4 py-3">
              <span>{c.title}</span>
              <span className="flex gap-3">
                <Link href={`/certificates/${c.id}`} className="underline">
                  {t("studentDash.viewCert", "View / PDF")}
                </Link>
                <Link href={`/certificates?verify=${c.id}`} className="underline">
                  {t("studentDash.verifyCert", "Verify")}
                </Link>
              </span>
            </li>
          ))}
          {certificates.length === 0 ? (
            <li className="text-[var(--color-muted)]">
              {t("studentDash.noCerts", "No certificates yet.")}
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
