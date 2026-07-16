import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings } from "@/lib/db";
import { getCertificateById, getCertificateDesignSettings } from "@/lib/lms-spec-db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { CertificateDocument } from "@/components/CertificateDocument";
import { CertificatePrintButton } from "@/components/CertificatePrintButton";

export default async function CertificatePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/login?callbackUrl=/certificates/${encodeURIComponent(id)}`);

  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const C = "certificates";
  const isEn = locale === "en";

  const certificate = await getCertificateById(id).catch(() => null);
  if (!certificate) notFound();

  const isOwner = session.user.id === certificate.userId;
  const isStaff = session.user.role === "ADMIN" || session.user.role === "ASSISTANT_ADMIN";
  if (!isOwner && !isStaff) notFound();

  let academyName = isEn ? "Mostafa Abdullah academy" : "أكاديمية مصطفى عبدالله";
  let design = null as Awaited<ReturnType<typeof getCertificateDesignSettings>> | null;
  try {
    const [settings, designSettings] = await Promise.all([
      getHomepageSettings(),
      getCertificateDesignSettings(),
    ]);
    academyName = pickLocalizedText(locale, settings.platformName, settings.platformNameEn) || academyName;
    design = designSettings;
  } catch {
    /* الإعدادات غير جاهزة — نستخدم الاسم/التصميم الافتراضي */
  }

  const verifyUrl = `/certificates/verify/${encodeURIComponent(certificate.certificateId)}`;
  const eyebrow =
    (isEn ? design?.eyebrowEn : design?.eyebrowAr)?.trim() || t(`${C}.certOfCompletion`);
  const title = (isEn ? design?.titleEn : design?.titleAr)?.trim() || t(`${C}.certTitle`);
  const signatureLabel =
    (isEn ? design?.signatureLabelEn : design?.signatureLabelAr)?.trim() || null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="certificate-print-hide mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/certificates" className="text-sm font-medium text-[#2563EB] hover:underline">
          {t(`${C}.backToList`)}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={verifyUrl}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-border)]/40"
          >
            {t(`${C}.verifyLink`)}
          </Link>
          <CertificatePrintButton label={t(`${C}.printButton`)} />
        </div>
      </div>

      <CertificateDocument
        studentName={certificate.studentName}
        courseTitle={certificate.courseTitle}
        score={certificate.score}
        issuedAt={certificate.issuedAt}
        certificateId={certificate.certificateId}
        academyName={academyName}
        locale={isEn ? "en" : "ar"}
        labels={{
          eyebrow,
          title,
          awardedTo: t(`${C}.awardedTo`),
          completionText: t(`${C}.completionText`),
          withScore: t(`${C}.withScore`),
          issuedOn: t(`${C}.issuedOn`),
          certificateIdLabel: t(`${C}.certificateId`),
        }}
        design={
          design
            ? {
                ...design,
                signatureLabel,
              }
            : null
        }
      />
    </div>
  );
}
