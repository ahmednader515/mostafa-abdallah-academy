import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings } from "@/lib/db";
import { listCertificatesForAdmin } from "@/lib/lms-spec-db";
import { listCertificateTemplates } from "@/lib/certificate-templates-db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { CertificatesTemplatesForm } from "./CertificatesTemplatesForm";

export default async function DashboardCertificatesSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");

  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);

  let templates: Awaited<ReturnType<typeof listCertificateTemplates>> = [];
  let certificates: Array<{
    id: string;
    certificateId: string;
    studentName: string;
    courseTitle: string;
    score: number | null;
    issuedAt: string | Date;
  }> = [];
  let academyName = "WorldWay";

  try {
    const [tpls, issued, homepage] = await Promise.all([
      listCertificateTemplates(),
      listCertificatesForAdmin(40),
      getHomepageSettings(),
    ]);
    templates = tpls;
    certificates = issued.map((c) => ({
      id: c.id,
      certificateId: c.certificateId,
      studentName: c.studentName,
      courseTitle: c.courseTitle,
      score: c.score,
      issuedAt: c.issuedAt,
    }));
    academyName =
      pickLocalizedText(locale, homepage.platformName, homepage.platformNameEn) || academyName;
  } catch {
    /* قاعدة البيانات غير جاهزة */
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboardNav.certificatesDesign", "Certificates & design")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.certificatesDesign.description",
          "Create certificate templates (orientation, signatures, seal, QR), assign them per course, and manage issued certificates.",
        )}
      </p>
      <CertificatesTemplatesForm
        initialTemplates={templates}
        initialCertificates={certificates}
        academyName={academyName}
        canDelete={session.user.role === "ADMIN"}
      />
    </div>
  );
}
