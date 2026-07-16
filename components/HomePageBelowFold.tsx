import { Fragment } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import {
  getCategories,
  getCoursesPublished,
  getReviews,
  listActiveSubscriptionPlansPublic,
  listStoreProductsPublic,
  listTeachersForHomepage,
  selectTeachersForHomepagePreview,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { getVisibleHomepageSections, getHomepageLiveStreams } from "@/lib/lms-spec-db";
import type { HomepageSetting, HomepageSection } from "@/lib/types";
import { CourseCard } from "@/components/CourseCard";
import { HorizontalScrollRow } from "@/components/HorizontalScrollRow";
import { HomeTeachersSection } from "@/components/HomeTeachersSection";
import { HomeSubscriptionsSection } from "@/components/HomeSubscriptionsSection";
import { HomeStoreSection } from "@/components/HomeStoreSection";
import { HomeLiveStreamsSection, type HomeLiveStream } from "@/components/HomeLiveStreamsSection";
import { HomePlatformDetailsSection } from "@/components/HomePlatformDetailsSection";
import { parsePlatformDetailsItems } from "@/lib/platform-details";
import { parsePlatformNewsItems } from "@/lib/platform-news";
import { HomePlatformNewsSlider } from "@/components/HomePlatformNewsSlider";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import {
  HOMEPAGE_DEFAULT_CTA_BADGE_AR,
  HOMEPAGE_DEFAULT_CTA_BUTTON_AR,
  HOMEPAGE_DEFAULT_CTA_DESCRIPTION_AR,
  HOMEPAGE_DEFAULT_CTA_TITLE_AR,
  HOMEPAGE_DEFAULT_PLATFORM_DETAILS_SUBTITLE_AR,
  HOMEPAGE_DEFAULT_PLATFORM_DETAILS_TITLE_AR,
  HOMEPAGE_DEFAULT_PLATFORM_NEWS_TITLE_AR,
  HOMEPAGE_DEFAULT_REVIEWS_SECTION_SUBTITLE_AR,
  HOMEPAGE_DEFAULT_REVIEWS_SECTION_TITLE_AR,
  HOMEPAGE_DEFAULT_STORE_SECTION_DESCRIPTION_AR,
  HOMEPAGE_DEFAULT_STORE_SECTION_TITLE_AR,
} from "@/lib/homepage-known-defaults";
import { homepageDefaultForLocale } from "@/lib/homepage-default-for-locale";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { HomeMainNavButtons } from "@/components/HomeMainNavButtons";
import { HomeSocialSection } from "@/components/HomeSocialSection";
import type { HomepageMainNavFlags } from "@/lib/homepage-hero-stats";
import { DEFAULT_MAIN_NAV_FLAGS } from "@/lib/homepage-hero-stats";

type CourseWithCategory = Awaited<ReturnType<typeof getCoursesPublished>>[number];

export async function HomePageBelowFold({
  homepageSettings,
  session,
  mainNavFlags,
}: {
  homepageSettings: HomepageSetting;
  session: Session | null;
  mainNavFlags?: HomepageMainNavFlags | null;
}) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  let courses: CourseWithCategory[] = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let reviews: Awaited<ReturnType<typeof getReviews>> = [];
  let teachersForHome: Awaited<ReturnType<typeof listTeachersForHomepage>> = [];
  let subscriptionPlansHome: Awaited<ReturnType<typeof listActiveSubscriptionPlansPublic>> = [];
  let storeProductsHome: Awaited<ReturnType<typeof listStoreProductsPublic>> = [];

  if (homepageSettings.teachersEnabled) {
    try {
      teachersForHome = await listTeachersForHomepage();
    } catch {
      /* جدول أو أعمدة غير جاهزة */
    }
  }
  if (homepageSettings.subscriptionsEnabled) {
    try {
      subscriptionPlansHome = await listActiveSubscriptionPlansPublic();
    } catch {
      /* جداول الاشتراك غير جاهزة */
    }
  }
  if (homepageSettings.storeEnabled) {
    try {
      storeProductsHome = await listStoreProductsPublic();
    } catch {
      /* جداول المتجر غير جاهزة */
    }
  }

  let studentPlatformSubscription: { active: boolean; expiresAtIso: string | null } | null = null;
  if (
    homepageSettings.subscriptionsEnabled &&
    session?.user?.role === "STUDENT" &&
    session.user.id
  ) {
    try {
      const active = await userHasActivePlatformSubscription(session.user.id);
      const exp = active ? await getLatestPlatformSubscriptionExpiry(session.user.id) : null;
      studentPlatformSubscription = {
        active,
        expiresAtIso: exp ? exp.toISOString() : null,
      };
    } catch {
      studentPlatformSubscription = { active: false, expiresAtIso: null };
    }
  }

  try {
    [courses, categories] = await Promise.all([getCoursesPublished(true), getCategories()]);
  } catch {
    // لا قاعدة بيانات أو غير متصلة
  }

  if (homepageSettings.teachersEnabled && teachersForHome.length > 0) {
    const teacherAccountIds = new Set(teachersForHome.map((t) => t.id));
    courses = courses.filter((c) => {
      const creator =
        (c as { createdById?: string | null }).createdById ??
        (c as { created_by_id?: string | null }).created_by_id ??
        null;
      return !creator || !teacherAccountIds.has(creator);
    });
  }

  try {
    reviews = await getReviews();
  } catch {
    /* جدول التعليقات غير موجود */
  }

  let visibleSections: HomepageSection[] = [];
  let homeLiveStreams: HomeLiveStream[] = [];
  try {
    [visibleSections, homeLiveStreams] = await Promise.all([
      getVisibleHomepageSections(),
      getHomepageLiveStreams() as Promise<HomeLiveStream[]>,
    ]);
  } catch {
    /* محرك الأقسام غير جاهز بعد — نستخدم الترتيب الثابت الحالي */
  }

  const platformNewsSlides = parsePlatformNewsItems(homepageSettings.platformNewsItems);
  const showPlatformNewsSection =
    Boolean(homepageSettings.platformNewsEnabled) && platformNewsSlides.length > 0;

  const teachersHomePreview =
    teachersForHome.length > 0
      ? selectTeachersForHomepagePreview(teachersForHome, 4).map(({ homepageOrder, ...row }) => {
          void homepageOrder;
          return row;
        })
      : [];

  const categoryIdToCourses = new Map<string, CourseWithCategory[]>();
  const uncategorized: CourseWithCategory[] = [];
  for (const c of courses) {
    const catId = (c as { category?: { id?: string } }).category?.id;
    if (catId) {
      if (!categoryIdToCourses.has(catId)) categoryIdToCourses.set(catId, []);
      categoryIdToCourses.get(catId)!.push(c);
    } else {
      uncategorized.push(c);
    }
  }

  const courseSections: { title: string; slug?: string; courses: CourseWithCategory[] }[] = [];
  for (const cat of categories) {
    const list = categoryIdToCourses.get(cat.id);
    if (list?.length) {
      courseSections.push({
        title: pickLocalizedText(locale, (cat as { nameAr?: string | null }).nameAr, cat.name),
        slug: cat.slug,
        courses: list,
      });
    }
  }
  if (uncategorized.length > 0) {
    courseSections.push({ title: t("courses.allCoursesTitle", "All courses"), courses: uncategorized });
  }

  const platformDetailsItems = parsePlatformDetailsItems(homepageSettings.platformDetailsItems);

  const rawReviewsTitle = pickLocalizedText(
    locale,
    homepageSettings.reviewsSectionTitle,
    homepageSettings.reviewsSectionTitleEn,
  );
  const rawReviewsSubtitle = pickLocalizedText(
    locale,
    homepageSettings.reviewsSectionSubtitle,
    homepageSettings.reviewsSectionSubtitleEn,
  );
  const reviewsTitle =
    locale === "en" &&
    (rawReviewsTitle === HOMEPAGE_DEFAULT_REVIEWS_SECTION_TITLE_AR || rawReviewsTitle === "")
      ? t("home.reviewsTitleDefault", "What students say")
      : rawReviewsTitle || t("home.reviewsTitleDefault", "What students say");
  const reviewsSubtitle =
    locale === "en" &&
    (rawReviewsSubtitle === HOMEPAGE_DEFAULT_REVIEWS_SECTION_SUBTITLE_AR || rawReviewsSubtitle === "")
      ? t("home.reviewsSubtitleDefault", "Real experiences from platform students")
      : rawReviewsSubtitle || t("home.reviewsSubtitleDefault", "Real experiences from platform students");

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
  const platformDetailsTitle = homepageDefaultForLocale(
    locale,
    pickLocalizedText(locale, homepageSettings.platformDetailsTitle, homepageSettings.platformDetailsTitleEn),
    HOMEPAGE_DEFAULT_PLATFORM_DETAILS_TITLE_AR,
    "home.platformDetailsDefaultTitle",
    t,
    "Qalam, the ideal solution!",
  );
  const platformDetailsSubtitle = homepageDefaultForLocale(
    locale,
    pickLocalizedText(locale, homepageSettings.platformDetailsSubtitle, homepageSettings.platformDetailsSubtitleEn),
    HOMEPAGE_DEFAULT_PLATFORM_DETAILS_SUBTITLE_AR,
    "home.platformDetailsDefaultSubtitle",
    t,
    "Discover what makes the platform stand out",
  );
  const storeSectionTitle = homepageDefaultForLocale(
    locale,
    pickLocalizedText(locale, homepageSettings.storeSectionTitle, homepageSettings.storeSectionTitleEn),
    HOMEPAGE_DEFAULT_STORE_SECTION_TITLE_AR,
    "home.storeSectionDefaultTitle",
    t,
    "Platform Store",
  );
  const storeSectionDescription = homepageDefaultForLocale(
    locale,
    pickLocalizedText(
      locale,
      homepageSettings.storeSectionDescription,
      homepageSettings.storeSectionDescriptionEn,
    ),
    HOMEPAGE_DEFAULT_STORE_SECTION_DESCRIPTION_AR,
    "home.storeSectionDefaultDescription",
    t,
    "Welcome to the platform store with essential study materials and books. Choose what suits your needs and benefit from organized digital content that supports your learning journey.",
  );
  const platformNewsTitle = homepageDefaultForLocale(
    locale,
    pickLocalizedText(
      locale,
      homepageSettings.platformNewsSectionTitle,
      homepageSettings.platformNewsSectionTitleEn,
    ),
    HOMEPAGE_DEFAULT_PLATFORM_NEWS_TITLE_AR,
    "home.platformNewsDefaultTitle",
    t,
    "Platform News",
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

  const platformDetailsBlock =
    homepageSettings.platformDetailsEnabled && platformDetailsItems.length > 0 ? (
      <HomePlatformDetailsSection
        title={platformDetailsTitle}
        subtitle={platformDetailsSubtitle || null}
        backgroundColor={homepageSettings.platformDetailsBackgroundColor?.trim() || null}
        items={platformDetailsItems}
      />
    ) : null;

  const teachersBlock = homepageSettings.teachersEnabled ? (
    <HomeTeachersSection enabled initialTeachers={teachersHomePreview} />
  ) : null;

  const subscriptionsBlock = homepageSettings.subscriptionsEnabled ? (
    <div id="home-subscriptions" className="scroll-mt-24">
      <HomeSubscriptionsSection
        enabled
        plans={subscriptionPlansHome}
        isStudent={session?.user?.role === "STUDENT"}
        isLoggedIn={!!session}
        studentPlatformSubscription={studentPlatformSubscription}
      />
    </div>
  ) : null;

  const coursesBlock =
    courseSections.length > 0 ? (
      <>
        {courseSections.map((section, idx) => (
          <section
            key={section.slug ?? `uncategorized-${idx}`}
            className="bg-white dark:bg-[var(--color-background)] mx-auto max-w-6xl px-4 py-16 sm:px-6"
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-foreground)]">{section.title}</h2>
                <p className="mt-1 text-[var(--color-muted)]">
                  {section.slug
                    ? `${t("courses.categoryCoursesPrefix", "Category courses:")} ${section.title}`
                    : t("courses.allCoursesTitle", "All courses")}
                </p>
              </div>
              <Link
                href={section.slug ? `/courses?category=${encodeURIComponent(section.slug)}` : "/courses"}
                className="text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                {t("common.courses", "Courses")} ←
              </Link>
            </div>

            <div className="mt-10">
              <HorizontalScrollRow>
                {section.courses.map((course) => {
                  const c = course as CourseWithCategory & {
                    lessonsCount?: number;
                    instructorName?: string | null;
                    titleAr?: string | null;
                    shortDesc?: string | null;
                    shortDescEn?: string | null;
                    imageUrl?: string | null;
                    courseRating?: unknown;
                    courseRatingCount?: unknown;
                  };
                  return (
                    <CourseCard
                      key={course.id}
                      course={{
                        id: c.id,
                        title: c.title,
                        titleAr: c.titleAr ?? c.title_ar,
                        slug: c.slug,
                        shortDesc: c.shortDesc ?? c.short_desc,
                        shortDescEn: c.shortDescEn ?? c.short_desc_en,
                        duration: c.duration,
                        level: c.level,
                        imageUrl: c.imageUrl ?? c.image_url,
                        price: c.price,
                        courseRating: c.courseRating ?? c.course_rating,
                        courseRatingCount: c.courseRatingCount ?? c.course_rating_count,
                        lessonsCount: c.lessonsCount,
                        instructorName: c.instructorName,
                        category: c.category
                          ? {
                              name: (c.category as { name?: string }).name ?? "",
                              nameAr:
                                (c.category as { nameAr?: string | null; name_ar?: string | null })
                                  .nameAr ??
                                (c.category as { name_ar?: string | null }).name_ar,
                            }
                          : null,
                      }}
                    />
                  );
                })}
              </HorizontalScrollRow>
            </div>
          </section>
        ))}
      </>
    ) : null;

  const storeBlock =
    homepageSettings.storeEnabled && storeProductsHome.length > 0 ? (
      <HomeStoreSection
        productsCount={storeProductsHome.length}
        sectionTitle={storeSectionTitle}
        sectionDescription={storeSectionDescription}
      />
    ) : null;

  const liveBlock =
    homeLiveStreams.length > 0 ? (
      <HomeLiveStreamsSection streams={homeLiveStreams} locale={locale === "en" ? "en" : "ar"} />
    ) : null;

  const reviewsBlock = (
    <section className="reviews-section border-t border-[var(--color-border)] bg-[var(--color-reviews-bg)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-[var(--color-foreground)]">{reviewsTitle}</h2>
        <p className="mt-1 text-[var(--color-muted)]">{reviewsSubtitle}</p>
        {reviews.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => {
              const letter =
                (r.avatarLetter && r.avatarLetter.trim()) || (r.authorName.trim()[0] ?? "؟");
              return (
                <div
                  key={r.id}
                  className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-reviews-avatar)] text-lg font-semibold text-[var(--color-muted)]">
                      {letter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-primary)]">{r.authorName}</p>
                      {r.authorTitle ? (
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">{r.authorTitle}</p>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-4 text-[var(--color-foreground)]">{r.text}</p>
                  {r.imageUrl ? (
                    <div className="mt-4 overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-black/5 p-2 dark:bg-white/5">
                      <img
                        src={r.imageUrl}
                        alt={`${t("home.reviewImageAltPrefix", "Review image from")} ${r.authorName}`}
                        loading="lazy"
                        className="h-auto max-h-72 w-full object-contain"
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-10 text-center text-[var(--color-muted)]">{t("home.noReviewsYet", "No reviews yet.")}</p>
        )}
      </div>
    </section>
  );

  const newsBlock = showPlatformNewsSection ? (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-6 text-2xl font-bold text-[var(--color-foreground)]">
          {platformNewsTitle}
        </h2>
        <HomePlatformNewsSlider items={platformNewsSlides} />
      </div>
    </section>
  ) : null;

  const socialBlock = <HomeSocialSection settings={homepageSettings} />;

  /** خريطة نوع القسم ← المحتوى المرئي المقابل له، لتغذية محرك ترتيب أقسام الرئيسية */
  const sectionBlocksByType: Record<string, React.ReactNode> = {
    platform_details: platformDetailsBlock,
    teachers: teachersBlock,
    subscriptions: subscriptionsBlock,
    courses: coursesBlock,
    store: storeBlock,
    library: storeBlock,
    live: liveBlock,
    reviews: reviewsBlock,
    news: newsBlock,
    social: socialBlock,
  };

  const hasDynamicSections = visibleSections.length > 0;

  return (
    <>
      <HomeMainNavButtons flags={mainNavFlags ?? DEFAULT_MAIN_NAV_FLAGS} />

      {hasDynamicSections ? (
        visibleSections.map((s) => <Fragment key={s.id}>{sectionBlocksByType[s.sectionType] ?? null}</Fragment>)
      ) : (
        <>
          {platformDetailsBlock}
          {teachersBlock}
          {homepageSettings.teachersEnabled && homepageSettings.subscriptionsEnabled ? (
            <div className="h-12 sm:h-16 md:h-24" aria-hidden />
          ) : null}
          {subscriptionsBlock}
          {coursesBlock}
          {storeBlock}
          {liveBlock}
          {reviewsBlock}
          {newsBlock}
          {socialBlock}
        </>
      )}

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
