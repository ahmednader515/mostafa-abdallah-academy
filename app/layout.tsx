import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { getServerSession } from "next-auth";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Footer } from "@/components/Footer";
import type { SidebarSocialLink } from "@/components/AppSidebar";
import { SessionProvider } from "@/components/SessionProvider";
import { SiteBrandProvider } from "@/components/SiteBrandProvider";
import { StoreSplashProvider } from "@/components/StoreSplashProvider";
import { InspectGuard } from "@/components/InspectGuard";
import { ForceLogoutGuard } from "@/components/ForceLogoutGuard";
import { MetaPixelTracker } from "@/components/MetaPixelTracker";
import { authOptions } from "@/lib/auth";
import {
  getHomepageSettings,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { normalizeHeroHex } from "@/lib/hero-bg";
import { getBrandAndAnalyticsSettingsCached, getPlatformLabelsMapCached } from "@/lib/cached-public-data";
import { getDir, makeTranslator } from "@/lib/i18n/core";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { LocaleProvider } from "@/components/LocaleProvider";
import { LabelsProvider } from "@/components/LabelsProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { homepageDefaultForLocale } from "@/lib/homepage-default-for-locale";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import {
  HOMEPAGE_DEFAULT_FOOTER_COPYRIGHT_AR,
  HOMEPAGE_DEFAULT_FOOTER_TAGLINE_AR,
  HOMEPAGE_DEFAULT_FOOTER_TITLE_AR,
  HOMEPAGE_DEFAULT_PLATFORM_NAME_AR,
} from "@/lib/homepage-known-defaults";
import {
  BRAND_COPYRIGHT_EN,
  BRAND_DESCRIPTION_AR,
  BRAND_DESCRIPTION_EN,
  BRAND_NAME_EN,
  BRAND_PAGE_TITLE_AR,
  BRAND_PAGE_TITLE_EN,
  BRAND_TAGLINE_EN,
} from "@/lib/brand";
import { listEnabledSocialLinks } from "@/lib/lms-spec-db";
import { parseNavTabs } from "@/lib/nav-tabs";

const cairo = localFont({
  src: [
    { path: "../public/fonts/static/Cairo-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/static/Cairo-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/static/Cairo-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/static/Cairo-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-cairo",
  display: "swap",
  preload: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  const defaultTitle = locale === "ar" ? BRAND_PAGE_TITLE_AR : BRAND_PAGE_TITLE_EN;
  const defaultDescription = locale === "ar" ? BRAND_DESCRIPTION_AR : BRAND_DESCRIPTION_EN;
  try {
    const [settings, brand] = await Promise.all([
      getHomepageSettings(),
      getBrandAndAnalyticsSettingsCached().catch(() => null),
    ]);
    const title = pickLocalizedText(locale, settings.pageTitle, settings.pageTitleEn) || defaultTitle;
    const description =
      pickLocalizedText(locale, settings.seoDescription, settings.seoDescriptionEn) ||
      defaultDescription;
    // Always route icons through /api/favicon so static app/favicon.* cannot override admin branding.
    // Cache-bust when the configured URL changes (browsers cache /favicon.ico aggressively).
    const faviconVersion = brand?.faviconUrl?.trim()
      ? Buffer.from(brand.faviconUrl.trim()).toString("base64url").slice(0, 24)
      : "default";
    const faviconHref = `/api/favicon?v=${faviconVersion}`;
    return {
      title,
      description,
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_PRIMARY_DOMAIN?.startsWith("http")
          ? process.env.NEXT_PUBLIC_PRIMARY_DOMAIN
          : process.env.NEXT_PUBLIC_PRIMARY_DOMAIN
            ? `https://${process.env.NEXT_PUBLIC_PRIMARY_DOMAIN}`
            : process.env.NEXTAUTH_URL || "http://localhost:3000",
      ),
      openGraph: {
        title,
        description,
        siteName: BRAND_NAME_EN,
        locale: locale === "ar" ? "ar_EG" : "en_US",
        type: "website",
      },
      icons: {
        icon: [{ url: faviconHref }],
        shortcut: faviconHref,
        apple: [{ url: `/api/favicon?variant=apple&v=${faviconVersion}` }],
      },
    };
  } catch {
    return { title: defaultTitle, description: defaultDescription };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, session, homepageSettingsResult, brand, platformLabels] = await Promise.all([
    getLocaleFromCookie(),
    getServerSession(authOptions),
    getHomepageSettings().catch(() => null),
    getBrandAndAnalyticsSettingsCached().catch(() => null),
    getPlatformLabelsMapCached(),
  ]);
  const dir = getDir(locale);
  const t = makeTranslator(locale);
  let platformName: string | null = HOMEPAGE_DEFAULT_PLATFORM_NAME_AR;
  let headerLogoUrl: string | null = null;
  let platformPrimaryColor: string | null = null;
  let footerTitle = t("footer.defaultTitle", HOMEPAGE_DEFAULT_FOOTER_TITLE_AR);
  let footerTagline = t("footer.defaultTagline", HOMEPAGE_DEFAULT_FOOTER_TAGLINE_AR);
  let footerCopyright = t("footer.defaultCopyright", HOMEPAGE_DEFAULT_FOOTER_COPYRIGHT_AR);
  const socialLinks: SidebarSocialLink[] = [];
  if (homepageSettingsResult) {
    const settings = homepageSettingsResult;
    platformName =
      pickLocalizedText(locale, settings.platformName, settings.platformNameEn) ||
      (locale === "en" ? BRAND_NAME_EN : HOMEPAGE_DEFAULT_PLATFORM_NAME_AR);
    headerLogoUrl = settings.headerLogoUrl ?? null;
    platformPrimaryColor = normalizeHeroHex(String(settings.primaryColor ?? "")) ?? null;
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
      BRAND_TAGLINE_EN,
    );
    footerCopyright = homepageDefaultForLocale(
      locale,
      rawFooterCopyright,
      HOMEPAGE_DEFAULT_FOOTER_COPYRIGHT_AR,
      "footer.defaultCopyright",
      t,
      BRAND_COPYRIGHT_EN,
    );
  } else {
    platformName = locale === "en" ? BRAND_NAME_EN : HOMEPAGE_DEFAULT_PLATFORM_NAME_AR;
  }

  try {
    const enabledSocial = await listEnabledSocialLinks();
    const networkMap: Record<string, SidebarSocialLink["network"]> = {
      whatsapp: "whatsapp",
      facebook: "facebook",
      telegram: "telegram",
      youtube: "youtube",
      linkedin: "linkedin",
      instagram: "instagram",
      tiktok: "tiktok",
      x: "x",
      twitter: "x",
    };
    for (const link of enabledSocial) {
      const network = networkMap[String(link.network || "").toLowerCase()];
      const href = link.url?.trim();
      if (!network || !href) continue;
      socialLinks.push({
        href,
        network,
        label:
          pickLocalizedText(locale, link.label, link.labelEn) ||
          network.charAt(0).toUpperCase() + network.slice(1),
      });
    }
  } catch {
    /* fall through to homepage URLs */
  }

  if (homepageSettingsResult) {
    const settings = homepageSettingsResult;
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
      { href: settings.teamWhatsappUrl, network: "whatsapp", label: "WhatsApp" },
      { href: settings.teamFacebookUrl, network: "facebook", label: "Facebook" },
      { href: settings.teamTelegramUrl, network: "telegram", label: "Telegram" },
      { href: settings.teamYoutubeUrl, network: "youtube", label: "YouTube" },
      { href: settings.teamLinkedinUrl, network: "linkedin", label: "LinkedIn" },
    ];
    const seen = new Set(socialLinks.map((l) => l.href.toLowerCase()));
    for (const p of supportPairs) {
      const href = p.href?.trim();
      if (!href) continue;
      const key = href.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      socialLinks.push({ href, network: p.network, label: p.label });
    }
  }

  let platformSubscriptionExpiryLabel: string | null = null;
  if (session?.user?.role === "STUDENT" && session.user.id) {
    try {
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
    } catch {
      platformSubscriptionExpiryLabel = null;
    }
  }

  let brandSecondaryColor: string | null = null;
  let brandAccentColor: string | null = null;
  let brandBackgroundColor: string | null = null;
  let brandFaviconUrl: string | null = null;
  let ga4Id: string | null = null;
  let gtmId: string | null = null;
  let facebookPixelId: string | null = null;
  if (brand) {
    brandSecondaryColor = normalizeHeroHex(String(brand.secondaryColor ?? "")) ?? null;
    brandAccentColor = normalizeHeroHex(String(brand.accentColor ?? "")) ?? null;
    brandBackgroundColor = normalizeHeroHex(String(brand.backgroundColor ?? "")) ?? null;
    brandFaviconUrl = brand.faviconUrl?.trim() || null;
    ga4Id = brand.ga4Id?.trim() || null;
    gtmId = brand.gtmId?.trim() || null;
    facebookPixelId = brand.facebookPixelId?.trim() || null;
  }

  const rootCssVars = [
    platformPrimaryColor ? `--platform-primary:${platformPrimaryColor};` : "",
    brandSecondaryColor ? `--platform-secondary:${brandSecondaryColor};` : "",
    brandAccentColor ? `--platform-accent:${brandAccentColor};` : "",
    brandBackgroundColor ? `--color-background:${brandBackgroundColor};` : "",
  ].join("");

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme");document.documentElement.classList.add(t==="dark"?"dark":"light");})();`,
          }}
        />
        {rootCssVars ? (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root{${rootCssVars}}`,
            }}
          />
        ) : null}
        <link
          rel="icon"
          href={
            brandFaviconUrl
              ? `/api/favicon?v=${Buffer.from(brandFaviconUrl).toString("base64url").slice(0, 24)}`
              : "/api/favicon?v=default"
          }
        />
        <link
          rel="apple-touch-icon"
          href={
            brandFaviconUrl
              ? `/api/favicon?variant=apple&v=${Buffer.from(brandFaviconUrl).toString("base64url").slice(0, 24)}`
              : "/api/favicon?variant=apple&v=default"
          }
        />
      </head>
      <body className={`${cairo.variable} ${cairo.className} font-sans antialiased min-h-screen`}>
        {gtmId ? (
          <>
            <Script id="gtm-init" strategy="lazyOnload">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>
          </>
        ) : null}
        {ga4Id ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
              strategy="lazyOnload"
            />
            <Script id="ga4-init" strategy="lazyOnload">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${ga4Id}');`}
            </Script>
          </>
        ) : null}
        {facebookPixelId ? (
          <>
            <Script id="facebook-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('set','autoConfig',false,'${facebookPixelId}');
fbq('init','${facebookPixelId}');`}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${encodeURIComponent(facebookPixelId)}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        ) : null}
        <NextTopLoader
          color={platformPrimaryColor ?? "#2563EB"}
          height={3}
          showSpinner={false}
          easing="ease"
          speed={300}
          shadow="0 0 10px rgba(37,99,235,0.4)"
        />
        <LocaleProvider locale={locale}>
          <LabelsProvider initialLabels={platformLabels}>
            <CurrencyProvider>
              <SiteBrandProvider
                platformName={platformName}
                headerLogoUrl={headerLogoUrl}
                platformNameColor={homepageSettingsResult?.platformNameColor ?? "#FFFFFF"}
                platformNameColor2={homepageSettingsResult?.platformNameColor2 ?? null}
                showPlatformName={homepageSettingsResult?.showPlatformName !== false}
                showPlatformLogo={homepageSettingsResult?.showPlatformLogo !== false}
              >
                <SessionProvider>
                  <StoreSplashProvider>
                    <InspectGuard />
                    <ForceLogoutGuard />
                    <MetaPixelTracker enabled={Boolean(facebookPixelId)} />
                    <AppShell
                      platformName={platformName}
                      headerLogoUrl={headerLogoUrl}
                      platformSubscriptionExpiryLabel={platformSubscriptionExpiryLabel}
                      socialLinks={socialLinks}
                      navTabs={parseNavTabs(homepageSettingsResult?.navTabsJson)}
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
              </SiteBrandProvider>
            </CurrencyProvider>
          </LabelsProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
