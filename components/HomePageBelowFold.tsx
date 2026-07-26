import { Fragment, Suspense } from "react";
import Link from "next/link";
import { getVisibleHomepageSectionsCached } from "@/lib/cached-public-data";
import { getVisibleHomepageSections } from "@/lib/lms-spec-db";
import type { HomepageSetting } from "@/lib/types";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import {
  HOMEPAGE_DEFAULT_CTA_BADGE_AR,
  HOMEPAGE_DEFAULT_CTA_BUTTON_AR,
  HOMEPAGE_DEFAULT_CTA_DESCRIPTION_AR,
  HOMEPAGE_DEFAULT_CTA_TITLE_AR,
} from "@/lib/homepage-known-defaults";
import { homepageDefaultForLocale } from "@/lib/homepage-default-for-locale";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { HomeMainNavButtons } from "@/components/HomeMainNavButtons";
import {
  DEFAULT_HOME_SECTION_ORDER,
  HomePageSectionIsland,
  HomeSectionIslandFallback,
} from "@/components/HomePageSectionIsland";
import type { HomepageMainNavFlags } from "@/lib/homepage-hero-stats";
import { DEFAULT_MAIN_NAV_FLAGS } from "@/lib/homepage-hero-stats";

/**
 * Below-fold homepage: section order + CTA.
 * Each section streams in its own Suspense island so a slow query
 * (jobs, reviews, etc.) cannot block courses/teachers.
 */
export async function HomePageBelowFold({
  homepageSettings,
  mainNavFlags,
}: {
  homepageSettings: HomepageSetting;
  mainNavFlags?: HomepageMainNavFlags | null;
}) {
  const [[t, locale], visibleSections] = await Promise.all([
    Promise.all([getServerTranslator(), getLocaleFromCookie()]),
    getVisibleHomepageSectionsCached().catch(
      () => [] as Awaited<ReturnType<typeof getVisibleHomepageSections>>,
    ),
  ]);

  const sectionOrder =
    visibleSections.length > 0
      ? visibleSections.map((s) => s.sectionType)
      : [...DEFAULT_HOME_SECTION_ORDER];

  const rawCtaBadge = pickLocalizedText(
    locale,
    homepageSettings.ctaBadgeText,
    homepageSettings.ctaBadgeTextEn,
  );
  const rawCtaTitle = pickLocalizedText(locale, homepageSettings.ctaTitle, homepageSettings.ctaTitleEn);
  const rawCtaDescription = pickLocalizedText(
    locale,
    homepageSettings.ctaDescription,
    homepageSettings.ctaDescriptionEn,
  );
  const rawCtaButton = pickLocalizedText(
    locale,
    homepageSettings.ctaButtonText,
    homepageSettings.ctaButtonTextEn,
  );
  const ctaBadge = homepageDefaultForLocale(
    locale,
    rawCtaBadge,
    HOMEPAGE_DEFAULT_CTA_BADGE_AR,
    "home.ctaBadgeDefault",
    t,
    "A stronger start to learning",
  );
  const ctaTitle = homepageDefaultForLocale(
    locale,
    rawCtaTitle,
    HOMEPAGE_DEFAULT_CTA_TITLE_AR,
    "home.ctaTitleDefault",
    t,
    "Ready to turn your dream into a real result?",
  );
  const ctaDescription = homepageDefaultForLocale(
    locale,
    rawCtaDescription,
    HOMEPAGE_DEFAULT_CTA_DESCRIPTION_AR,
    "home.ctaDescriptionDefault",
    t,
    "Start now with a confident step: organized content, clear explanations, and practical exercises that help you retain what you learn faster. Every lesson you complete today brings you closer to the level you deserve tomorrow.",
  );
  const ctaButton = homepageDefaultForLocale(
    locale,
    rawCtaButton,
    HOMEPAGE_DEFAULT_CTA_BUTTON_AR,
    "home.ctaButtonDefault",
    t,
    "Start your journey now",
  );

  return (
    <>
      <HomeMainNavButtons flags={mainNavFlags ?? DEFAULT_MAIN_NAV_FLAGS} />

      {sectionOrder.map((sectionType, index) => (
        <Fragment key={`${sectionType}-${index}`}>
          {sectionType === "subscriptions" &&
          homepageSettings.teachersEnabled &&
          homepageSettings.subscriptionsEnabled &&
          visibleSections.length === 0 ? (
            <div className="h-12 sm:h-16 md:h-24" aria-hidden />
          ) : null}
          <Suspense fallback={<HomeSectionIslandFallback minHeight={sectionType === "courses" ? 420 : 280} />}>
            <HomePageSectionIsland sectionType={sectionType} homepageSettings={homepageSettings} />
          </Suspense>
        </Fragment>
      ))}

      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-8 sm:p-12">
            <div className="text-center">
              <p className="inline-flex items-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-1 text-xs font-semibold text-[var(--color-primary)] sm:text-sm">
                {ctaBadge}
              </p>
              <h2 className="mt-4 text-3xl font-extrabold text-[var(--color-foreground)] sm:text-4xl">
                {ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                {ctaDescription}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-xs text-[var(--color-muted)]">
                  {t("home.ctaChip1", "Clear, simple explanations")}
                </span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-xs text-[var(--color-muted)]">
                  {t("home.ctaChip2", "Ongoing support")}
                </span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-xs text-[var(--color-muted)]">
                  {t("home.ctaChip3", "Tangible results")}
                </span>
              </div>

              <Link
                href="/#home-next-section"
                className="mt-8 inline-flex items-center justify-center rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-8 py-3 text-base font-bold text-white transition hover:scale-[1.02] hover:bg-[var(--color-primary-hover)]"
              >
                {ctaButton}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function HomePageBelowFoldFallback() {
  return (
    <div className="min-h-[40vh] animate-pulse bg-[var(--color-surface)]" aria-busy="true" aria-label="Loading content">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-16 sm:px-6">
        <div className="h-8 w-48 rounded bg-[var(--color-border)]" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-[var(--radius-card)] bg-[var(--color-border)]/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
