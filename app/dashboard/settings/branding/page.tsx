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
    platformNameColor: "#FFFFFF" as string | null,
    platformNameColor2: "" as string | null,
    showPlatformName: true,
    showPlatformLogo: true,
    ga4Id: "" as string | null,
    gtmId: "" as string | null,
    facebookPixelId: "" as string | null,
    metaCapiConfigured: false,
    contactEmail: "" as string | null,
    defaultCurrency: "EGP" as string | null,
    seoTitle: "" as string | null,
    seoTitleEn: "" as string | null,
    seoDescription: "" as string | null,
    seoDescriptionEn: "" as string | null,
    authLoginBody: "" as string | null,
    authLoginBodyEn: "" as string | null,
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
      platformNameColor: homepage.platformNameColor ?? "#FFFFFF",
      platformNameColor2: homepage.platformNameColor2 ?? "",
      showPlatformName: homepage.showPlatformName !== false,
      showPlatformLogo: homepage.showPlatformLogo !== false,
      ga4Id: brand.ga4Id,
      gtmId: brand.gtmId,
      facebookPixelId: brand.facebookPixelId,
      metaCapiConfigured: brand.metaCapiConfigured === true,
      contactEmail: (homepage as { contactEmail?: string | null }).contactEmail ?? null,
      defaultCurrency: (homepage as { defaultCurrency?: string | null }).defaultCurrency ?? "EGP",
      seoTitle: homepage.pageTitle ?? null,
      seoTitleEn: homepage.pageTitleEn ?? null,
      seoDescription: homepage.seoDescription ?? null,
      seoDescriptionEn: homepage.seoDescriptionEn ?? null,
      authLoginBody: homepage.authLoginBody ?? null,
      authLoginBodyEn: homepage.authLoginBodyEn ?? null,
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
          "Manage brand colors, favicon, browser title/description, and analytics integrations.",
        )}
      </p>
      <BrandingSettingsForm initialSettings={initial} />
    </div>
  );
}
