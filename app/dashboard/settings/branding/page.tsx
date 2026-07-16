import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getBrandAndAnalyticsSettings } from "@/lib/lms-spec-db";
import { getHomepageSettings } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { BrandingSettingsForm } from "./BrandingSettingsForm";

export default async function DashboardBrandingSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();

  let initial = {
    primaryColor: "" as string | null,
    secondaryColor: "" as string | null,
    accentColor: "" as string | null,
    backgroundColor: "" as string | null,
    faviconUrl: "" as string | null,
    headerLogoUrl: "" as string | null,
    platformName: "" as string | null,
    platformNameEn: "" as string | null,
    ga4Id: "" as string | null,
    gtmId: "" as string | null,
    facebookPixelId: "" as string | null,
  };
  try {
    const [brand, homepage] = await Promise.all([getBrandAndAnalyticsSettings(), getHomepageSettings()]);
    initial = {
      primaryColor: homepage.primaryColor ?? null,
      secondaryColor: brand.secondaryColor,
      accentColor: brand.accentColor,
      backgroundColor: brand.backgroundColor,
      faviconUrl: brand.faviconUrl,
      headerLogoUrl: homepage.headerLogoUrl ?? null,
      platformName: homepage.platformName ?? null,
      platformNameEn: homepage.platformNameEn ?? null,
      ga4Id: brand.ga4Id,
      gtmId: brand.gtmId,
      facebookPixelId: brand.facebookPixelId,
    };
  } catch {
    /* قاعدة البيانات غير متصلة */
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboardNav.branding", "Branding & analytics")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.brandingDescription",
          "Manage platform brand colors, favicon, and analytics integrations (Google Analytics 4, Google Tag Manager, Facebook Pixel).",
        )}
      </p>
      <BrandingSettingsForm initialSettings={initial} />
    </div>
  );
}
