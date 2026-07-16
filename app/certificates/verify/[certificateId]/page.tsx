import Link from "next/link";
import { getCertificateByPublicId } from "@/lib/lms-spec-db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const C = "certificates";

  const certificate = await getCertificateByPublicId(decodeURIComponent(certificateId)).catch(() => null);
  const isValid = !!certificate;

  const dateLabel = certificate
    ? new Date(certificate.issuedAt).toLocaleDateString(locale === "en" ? "en-US" : "ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t(`${C}.verifyTitle`)}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t(`${C}.verifySubtitle`)}</p>
      </div>

      <div
        className={`mt-8 rounded-2xl border-2 p-8 shadow-[var(--shadow-card)] ${
          isValid ? "border-[#16a34a] bg-[#16a34a]/5" : "border-[#dc2626] bg-[#dc2626]/5"
        }`}
      >
        {isValid && certificate ? (
          <>
            <p className="text-center text-lg font-bold text-[#16a34a]">{t(`${C}.verifiedTitle`)}</p>
            <p className="mt-1 text-center text-sm text-[var(--color-muted)]">{t(`${C}.verifiedSubtitle`)}</p>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <dt className="text-[var(--color-muted)]">{t(`${C}.studentName`)}</dt>
                <dd className="font-semibold text-[var(--color-foreground)]">{certificate.studentName}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <dt className="text-[var(--color-muted)]">{t(`${C}.courseTitle`)}</dt>
                <dd className="font-semibold text-[var(--color-foreground)]">{certificate.courseTitle}</dd>
              </div>
              {certificate.score != null && (
                <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                  <dt className="text-[var(--color-muted)]">{t(`${C}.score`)}</dt>
                  <dd className="font-semibold text-[#F59E0B]">{certificate.score}%</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <dt className="text-[var(--color-muted)]">{t(`${C}.issuedOn`)}</dt>
                <dd className="font-semibold text-[var(--color-foreground)]">{dateLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[var(--color-muted)]">{t(`${C}.certificateId`)}</dt>
                <dd className="font-mono font-semibold text-[var(--color-foreground)]">
                  {certificate.certificateId}
                </dd>
              </div>
            </dl>
            <div className="mt-6 text-center">
              <Link
                href={`/certificates/${encodeURIComponent(certificate.id)}`}
                className="text-sm font-medium text-[#2563EB] hover:underline"
              >
                {t(`${C}.viewOfficialCertificate`)}
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-center text-lg font-bold text-[#dc2626]">{t(`${C}.notFoundTitle`)}</p>
            <p className="mt-2 text-center text-sm text-[var(--color-muted)]">{t(`${C}.notFoundSubtitle`)}</p>
          </>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm font-medium text-[#2563EB] hover:underline">
          {t("common.home")}
        </Link>
      </div>
    </div>
  );
}
