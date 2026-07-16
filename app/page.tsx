import { Suspense } from "react";
import { preload } from "react-dom";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

/** إعادة توليد الصفحة كل دقيقة لتحسين سرعة التحميل الأولي */
export const revalidate = 60;

export default async function HomePage() {
  const [session, homepageSettings] = await Promise.all([
    getServerSession(authOptions),
    getHomepageSettings(),
  ]);

  const heroSlides = parseHeroSlidesJson(homepageSettings.heroSlidesJson);
  const statsItems = parseStatsRibbonJson(homepageSettings.statsRibbonJson);
  const mainNavFlags = parseMainNavFlagsJson(homepageSettings.mainNavFlagsJson);

  const firstImage = heroSlides[0]?.image?.trim();
  if (firstImage?.startsWith("/")) {
    preload(firstImage, { as: "image" });
  } else {
    preload("/background.png", { as: "image" });
  }

  const subscribeHref =
    session?.user?.role === "STUDENT"
      ? "/#home-subscriptions"
      : session
        ? "/dashboard"
        : "/register";

  return (
    <div className="bg-[var(--color-sections)]">
      <AcademyHomeHero subscribeHref={subscribeHref} slides={heroSlides} />
      <HomeStatsRibbon items={statsItems} />

      <div id="home-next-section" className="scroll-mt-20" />

      <Suspense fallback={<HomePageBelowFoldFallback />}>
        <HomePageBelowFold
          homepageSettings={homepageSettings}
          session={session}
          mainNavFlags={mainNavFlags}
        />
      </Suspense>
    </div>
  );
}
