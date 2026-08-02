import Link from "next/link";
import { notFound } from "next/navigation";
import { getHomepageSettings } from "@/lib/db";
import { getCertificateByPublicId } from "@/lib/lms-spec-db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { CertificateDocument } from "@/components/CertificateDocument";
import { CertificateActions } from "@/components/certificates/CertificateActions";
import { publicCertificatePath, resolveTemplateForCertificate } from "@/lib/certificate-view";

type Props = { params: Promise<{ certificateId: string }> };

export async function generateMetadata({ params }: Props) {
  const t = await getServerTranslator();
  const { certificateId } = await params;
  const cert = await getCertificateByPublicId(decodeURIComponent(certificateId)).catch(() => null);
  if (!cert) return { title: t("certificates.notFound", "Certificate not found") };
  return {
    title: `${cert.studentName} — ${cert.courseTitle}`,
    description: t("certificates.publicMeta", "Official course completion certificate"),
  };
}

export default async function PublicCertificatePage({ params }: Props) {
  const { certificateId: raw } = await params;
  const certificateId = decodeURIComponent(raw).trim();
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const C = "certificates";
  const isEn = locale === "en";

  const certificate = await getCertificateByPublicId(certificateId).catch(() => null);
  if (!certificate) notFound();

  let academyName = "WorldWay";
  try {
    const settings = await getHomepageSettings();
    academyName = pickLocalizedText(locale, settings.platformName, settings.platformNameEn) || academyName;
  } catch {
    /* noop */
  }

  const template = await resolveTemplateForCertificate(certificate);
  const sharePath = publicCertificatePath(certificate.certificateId);
  const eyebrow =
    (isEn ? template.eyebrowEn : template.eyebrowAr)?.trim() || t(`${C}.certOfCompletion`);
  const title = (isEn ? template.titleEn : template.titleAr)?.trim() || t(`${C}.certTitle`);
  const completionText =
    (isEn ? template.bodyEn : template.bodyAr)?.trim() || t(`${C}.completionText`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="certificate-print-hide mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/certificates" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          {t(`${C}.backToList`)}
        </Link>
        <CertificateActions
          shareUrl={sharePath}
          certificateId={certificate.certificateId}
          orientation={template.orientation}
          copyLabel={t(`${C}.copyLink`, "Copy certificate link")}
          copiedLabel={t(`${C}.linkCopied`, "Link copied")}
          downloadPdfLabel={t(`${C}.downloadPdf`, "Download PDF")}
          downloadingLabel={t(`${C}.downloadingPdf`, "Preparing PDF…")}
          printLabel={t(`${C}.printButton`)}
          downloadFailedLabel={t(`${C}.pdfFailed`, "Could not generate PDF")}
        />
      </div>

      <CertificateDocument
        studentName={certificate.studentName}
        courseTitle={certificate.courseTitle}
        score={certificate.score}
        issuedAt={certificate.issuedAt}
        certificateId={certificate.certificateId}
        academyName={academyName}
        locale={isEn ? "en" : "ar"}
        verifyUrl={sharePath}
        labels={{
          eyebrow,
          title,
          awardedTo: t(`${C}.awardedTo`),
          completionText,
          withScore: t(`${C}.withScore`),
          issuedOn: t(`${C}.issuedOn`),
          certificateIdLabel: t(`${C}.certificateId`),
        }}
        design={template}
      />
    </div>
  );
}
