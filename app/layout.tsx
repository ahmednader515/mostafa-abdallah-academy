import type { Metadata } from "next";
import localFont from "next/font/local";
import NextTopLoader from "nextjs-toploader";
import { getServerSession } from "next-auth";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import type { SidebarSocialLink } from "@/components/AppSidebar";
import { SessionProvider } from "@/components/SessionProvider";
import { StoreSplashProvider } from "@/components/StoreSplashProvider";
import { InspectGuard } from "@/components/InspectGuard";
import { ForceLogoutGuard } from "@/components/ForceLogoutGuard";
import { authOptions } from "@/lib/auth";
import {
  getHomepageSettings,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { normalizeHeroHex } from "@/lib/hero-bg";
import { getDir, makeTranslator } from "@/lib/i18n/core";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { LocaleProvider } from "@/components/LocaleProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { homepageDefaultForLocale } from "@/lib/homepage-default-for-locale";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import {
  HOMEPAGE_DEFAULT_FOOTER_COPYRIGHT_AR,
  HOMEPAGE_DEFAULT_FOOTER_TAGLINE_AR,
  HOMEPAGE_DEFAULT_FOOTER_TITLE_AR,
  HOMEPAGE_DEFAULT_PLATFORM_NAME_AR,
} from "@/lib/homepage-known-defaults";

const cairo = localFont({
  src: [
    { path: "../public/fonts/static/Cairo-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../public/fonts/static/Cairo-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/static/Cairo-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/static/Cairo-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/static/Cairo-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/static/Cairo-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/static/Cairo-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../public/fonts/static/Cairo-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-cairo",
  display: "swap",
});

const BRAND_NAME_EN = "Mostafa Abdullah academy";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  const defaultTitle =
    locale === "ar"
      ? "Mostafa Abdullah academy | دورات سياحة وضيافة جوية"
      : "Mostafa Abdullah academy | Tourism & Aviation Training";
  const defaultDescription =
    locale === "ar"
      ? "أكاديمية متخصصة في السياحة والسفر والضيافة الجوية"
      : "Specialized academy for tourism, travel, and aviation hospitality";
  try {
    const settings = await getHomepageSettings();
    const title = pickLocalizedText(locale, settings.pageTitle, settings.pageTitleEn) || defaultTitle;
    return { title, description: defaultDescription };
  } catch {
    return { title: defaultTitle, description: defaultDescription };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromCookie();
  const session = await getServerSession(authOptions);
  const dir = getDir(locale);
  const t = makeTranslator(locale);
  let platformName: string | null = HOMEPAGE_DEFAULT_PLATFORM_NAME_AR;
  let headerLogoUrl: string | null = null;
  let platformPrimaryColor: string | null = null;
  let footerTitle = t("footer.defaultTitle", HOMEPAGE_DEFAULT_FOOTER_TITLE_AR);
  let footerTagline = t("footer.defaultTagline", HOMEPAGE_DEFAULT_FOOTER_TAGLINE_AR);
  let footerCopyright = t("footer.defaultCopyright", HOMEPAGE_DEFAULT_FOOTER_COPYRIGHT_AR);
  const socialLinks: SidebarSocialLink[] = [];
  try {
    const settings = await getHomepageSettings();
    platformName =
      pickLocalizedText(locale, settings.platformName, settings.platformNameEn) ||
      (locale === "en" ? BRAND_NAME_EN : HOMEPAGE_DEFAULT_PLATFORM_NAME_AR);
    headerLogoUrl = settings.headerLogoUrl ?? null;
    platformPrimaryColor = normalizeHeroHex(String(settings.primaryColor ?? "")) ?? null;
    const supportPairs: Array<{
      href: string | null | undefined;
      network: SidebarSocialLink["network"];
      label: string;
    }> = [
      { href: settings.whatsappUrl, network: "whatsapp", label: "WhatsApp" },
      { href: settings.facebookUrl, network: "facebook", label: "Facebook" },
      { href: settings.telegramUrl, network: "telegram", label: "Telegram" },
      { href: settings.youtubeUrl, network: "youtube", label: "YouTube" },
      { href: settings.linkedinUrl, network: "linkedin", label: "LinkedIn" },
    ];
    for (const p of supportPairs) {
      const href = p.href?.trim();
      if (href) socialLinks.push({ href, network: p.network, label: p.label });
    }
    const rawFooterTitle = pickLocalizedText(locale, settings.footerTitle, settings.footerTitleEn);
    const rawFooterTagline = pickLocalizedText(locale, settings.footerTagline, settings.footerTaglineEn);
    const rawFooterCopyright = pickLocalizedText(locale, settings.footerCopyright, settings.footerCopyrightEn);
    footerTitle = homepageDefaultForLocale(
      locale,
      rawFooterTitle,
      HOMEPAGE_DEFAULT_FOOTER_TITLE_AR,
      "footer.defaultTitle",
      t,
      BRAND_NAME_EN,
    );
    footerTagline = homepageDefaultForLocale(
      locale,
      rawFooterTagline,
      HOMEPAGE_DEFAULT_FOOTER_TAGLINE_AR,
      "footer.defaultTagline",
      t,
      "Learn from the best in tourism and aviation hospitality",
    );
    footerCopyright = homepageDefaultForLocale(
      locale,
      rawFooterCopyright,
      HOMEPAGE_DEFAULT_FOOTER_COPYRIGHT_AR,
      "footer.defaultCopyright",
      t,
      "Mostafa Abdullah academy. All rights reserved.",
    );
  } catch {
    platformName = locale === "en" ? BRAND_NAME_EN : HOMEPAGE_DEFAULT_PLATFORM_NAME_AR;
  }

  let platformSubscriptionExpiryLabel: string | null = null;
  try {
    if (session?.user?.role === "STUDENT" && session.user.id) {
      const active = await userHasActivePlatformSubscription(session.user.id);
      if (active) {
        const exp = await getLatestPlatformSubscriptionExpiry(session.user.id);
        if (exp) {
          platformSubscriptionExpiryLabel = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(exp);
        } else {
          platformSubscriptionExpiryLabel = t("header.active", "نشط");
        }
      }
    }
  } catch {
    platformSubscriptionExpiryLabel = null;
  }

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme");document.documentElement.classList.add(t==="dark"?"dark":"light");})();`,
          }}
        />
        {platformPrimaryColor ? (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root{--platform-primary:${platformPrimaryColor};}`,
            }}
          />
        ) : null}
      </head>
      <body className={`${cairo.variable} ${cairo.className} font-sans antialiased min-h-screen`}>
        <NextTopLoader
          color={platformPrimaryColor ?? "#2563EB"}
          height={3}
          showSpinner={false}
          easing="ease"
          speed={300}
          shadow="0 0 10px rgba(37,99,235,0.4)"
        />
        <LocaleProvider locale={locale}>
          <CurrencyProvider>
            <SessionProvider>
              <StoreSplashProvider>
                <InspectGuard />
                <ForceLogoutGuard />
                <AppShell
                  platformName={platformName}
                  headerLogoUrl={headerLogoUrl}
                  platformSubscriptionExpiryLabel={platformSubscriptionExpiryLabel}
                  socialLinks={socialLinks}
                  footer={
                    <Footer
                      footerTitle={footerTitle}
                      footerTagline={footerTagline}
                      footerCopyright={footerCopyright}
                    />
                  }
                >
                  {children}
                </AppShell>
              </StoreSplashProvider>
            </SessionProvider>
          </CurrencyProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
