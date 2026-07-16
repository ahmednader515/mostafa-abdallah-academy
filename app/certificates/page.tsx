import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCertificatesForUser } from "@/lib/lms-spec-db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { CertificateVerifyForm } from "@/components/CertificateVerifyForm";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const C = "certificates";

  const certificates =
    session?.user?.id ? await getCertificatesForUser(session.user.id).catch(() => []) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-[var(--color-foreground)]">{t(`${C}.pageTitle`)}</h1>
      <p className="mt-2 text-[var(--color-muted)]">{t(`${C}.pageSubtitle`)}</p>

      <div className="mt-8">
        <CertificateVerifyForm />
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          {t(`${C}.myCertificates`, "My certificates")}
        </h2>

        {!session ? (
          <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <p className="text-[var(--color-muted)]">{t(`${C}.loginHint`)}</p>
            <Link
              href="/login?callbackUrl=/certificates"
              className="mt-6 inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
            >
              {t("header.login", "Log in")}
            </Link>
          </div>
        ) : certificates.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <p className="text-[var(--color-muted)]">{t(`${C}.emptyStudent`)}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/exams"
                className="inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
              >
                {t("nav.exams", "Exams")}
              </Link>
              <Link
                href="/courses"
                className="inline-flex rounded-[var(--radius-btn)] border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-foreground)]"
              >
                {t("common.courses", "Courses")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {certificates.map((cert) => {
              const dateLabel = new Date(cert.issuedAt).toLocaleDateString(
                locale === "en" ? "en-US" : "ar-EG",
                { year: "numeric", month: "long", day: "numeric" },
              );
              return (
                <div
                  key={cert.id}
                  className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
                >
                  <div
                    className="h-2 w-full"
                    style={{ background: "linear-gradient(90deg,#0F172A,#2563EB,#F59E0B)" }}
                  />
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-[var(--color-foreground)]">{cert.courseTitle}</h3>
                    <dl className="mt-3 space-y-1 text-sm text-[var(--color-muted)]">
                      <div className="flex items-center justify-between gap-2">
                        <dt>{t(`${C}.issuedOn`)}</dt>
                        <dd>{dateLabel}</dd>
                      </div>
                      {cert.score != null && (
                        <div className="flex items-center justify-between gap-2">
                          <dt>{t(`${C}.score`)}</dt>
                          <dd className="font-semibold text-[var(--color-accent)]">{cert.score}%</dd>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <dt>{t(`${C}.certificateId`)}</dt>
                        <dd className="font-mono text-xs">{cert.certificateId}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/certificates/${encodeURIComponent(cert.id)}`}
                        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
                      >
                        {t(`${C}.viewAndPrint`)}
                      </Link>
                      <Link
                        href={`/certificates/verify/${encodeURIComponent(cert.certificateId)}`}
                        className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/40"
                      >
                        {t(`${C}.verifyLink`)}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
