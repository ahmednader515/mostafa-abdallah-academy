import { Suspense } from "react";
import { preload } from "react-dom";
import { getHomepageSettings } from "@/lib/db";
import { AcademyHomeHero } from "@/components/AcademyHomeHero";
import { HomeStatsRibbon } from "@/components/HomeStatsRibbon";
import {
  HomePageBelowFold,
  HomePageBelowFoldFallback,
} from "@/components/HomePageBelowFold";
import {
  parseHeroSlidesJson,
  parseMainNavFlagsJson,
  parseStatsRibbonJson,
} from "@/lib/homepage-hero-stats";

/** Cache homepage shell aggressively; below-fold has its own cached queries. */
export const revalidate = 60;

/**
 * Above-the-fold only: settings + hero + stats.
 * Session is intentionally NOT awaited here — layout already loads it,
 * and the hero CTA scrolls to subscriptions without needing auth.
 */
export default async function HomePage() {
  const homepageSettings = await getHomepageSettings();

  const heroSlides = parseHeroSlidesJson(homepageSettings.heroSlidesJson);
  const statsItems = parseStatsRibbonJson(homepageSettings.statsRibbonJson);
  const mainNavFlags = parseMainNavFlagsJson(homepageSettings.mainNavFlagsJson);

  const firstImage = heroSlides[0]?.image?.trim();
  if (firstImage?.startsWith("/")) {
    preload(firstImage, { as: "image", fetchPriority: "high" });
  } else {
    preload("/background.webp", { as: "image", fetchPriority: "high" });
  }

  return (
    <div className="bg-[var(--color-sections)]">
      <AcademyHomeHero subscribeHref="/#home-subscriptions" slides={heroSlides} />
      <HomeStatsRibbon items={statsItems} />

      <div id="home-next-section" className="scroll-mt-20" />

      <Suspense fallback={<HomePageBelowFoldFallback />}>
        <HomePageBelowFold homepageSettings={homepageSettings} mainNavFlags={mainNavFlags} />
      </Suspense>
    </div>
  );
}
