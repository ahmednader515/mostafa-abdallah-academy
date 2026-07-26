import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCategories,
  getLatestPlatformSubscriptionExpiry,
  getReviews,
  listActiveSubscriptionPlansPublic,
  listPublishedJobsForHomepage,
  listTeachersHomepagePreviewOnly,
  userHasActivePlatformSubscription,
  type HomepageCourseCard,
} from "@/lib/db";
import {
  getCategoriesCached,
  getHomepageLiveStreamsCached,
  getPublishedCoursesForHomepageCached,
  getPublishedJobsForHomepageCached,
  getReviewsForHomepageCached,
  getStoreProductsCountPublicCached,
  getSubscriptionPlansPublicCached,
  getTeachersHomepagePreviewCached,
} from "@/lib/cached-public-data";
import type { HomepageSetting } from "@/lib/types";
import { CourseCard } from "@/components/CourseCard";
import { HorizontalScrollRow } from "@/components/HorizontalScrollRow";
import { HomeTeachersSection } from "@/components/HomeTeachersSection";
import { HomeSubscriptionsSection } from "@/components/HomeSubscriptionsSection";
import { HomeStoreSection } from "@/components/HomeStoreSection";
import { HomeJobsSection } from "@/components/HomeJobsSection";
import { HomePolicyCardsSection } from "@/components/HomePolicyCardsSection";
import { HomeLiveStreamsSection, type HomeLiveStream } from "@/components/HomeLiveStreamsSection";
import { HomePlatformDetailsSection } from "@/components/HomePlatformDetailsSection";
import { parsePlatformDetailsItems } from "@/lib/platform-details";
import { parsePlatformNewsItems } from "@/lib/platform-news";
import { HomePlatformNewsSlider } from "@/components/HomePlatformNewsSlider";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import {
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
import { HomeSocialSection } from "@/components/HomeSocialSection";
import { LazySection } from "@/components/LazySection";
import { OptimizedImage } from "@/components/OptimizedImage";

async function loadStudentSubscription(userId: string) {
  try {
    const active = await userHasActivePlatformSubscription(userId);
    const exp = active ? await getLatestPlatformSubscriptionExpiry(userId) : null;
    return { active, expiresAtIso: exp ? exp.toISOString() : null };
  } catch {
    return { active: false, expiresAtIso: null };
  }
}

/** One homepage section — own data fetch so Suspense can stream independently. */
export async function HomePageSectionIsland({
  sectionType,
  homepageSettings,
}: {
  sectionType: string;
  homepageSettings: HomepageSetting;
}) {
  const [[t, locale], session] = await Promise.all([
    Promise.all([getServerTranslator(), getLocaleFromCookie()]),
    getServerSession(authOptions).catch(() => null),
  ]);

  switch (sectionType) {
    case "platform_details": {
      if (!homepageSettings.platformDetailsEnabled) return null;
      const items = parsePlatformDetailsItems(homepageSettings.platformDetailsItems);
      if (!items.length) return null;
      const title = homepageDefaultForLocale(
        locale,
        pickLocalizedText(locale, homepageSettings.platformDetailsTitle, homepageSettings.platformDetailsTitleEn),
        HOMEPAGE_DEFAULT_PLATFORM_DETAILS_TITLE_AR,
        "home.platformDetailsDefaultTitle",
        t,
        "Qalam, the ideal solution!",
      );
      const subtitle = homepageDefaultForLocale(
        locale,
        pickLocalizedText(
          locale,
          homepageSettings.platformDetailsSubtitle,
          homepageSettings.platformDetailsSubtitleEn,
        ),
        HOMEPAGE_DEFAULT_PLATFORM_DETAILS_SUBTITLE_AR,
        "home.platformDetailsDefaultSubtitle",
        t,
        "Discover what makes the platform stand out",
      );
      return (
        <LazySection minHeight={360}>
          <HomePlatformDetailsSection
            title={title}
            subtitle={subtitle || null}
            backgroundColor={homepageSettings.platformDetailsBackgroundColor?.trim() || null}
            items={items}
          />
        </LazySection>
      );
    }

    case "teachers": {
      if (!homepageSettings.teachersEnabled) return null;
      const teachersForHome = await getTeachersHomepagePreviewCached().catch(
        () => [] as Awaited<ReturnType<typeof listTeachersHomepagePreviewOnly>>,
      );
      const teachersHomePreview = teachersForHome.map(({ homepageOrder, ...row }) => {
        void homepageOrder;
        return row;
      });
      return (
        <LazySection minHeight={420}>
          <HomeTeachersSection enabled initialTeachers={teachersHomePreview} />
        </LazySection>
      );
    }

    case "subscriptions": {
      if (!homepageSettings.subscriptionsEnabled) return null;
      const studentId =
        session?.user?.role === "STUDENT" && session.user.id ? session.user.id : null;
      const [plans, studentPlatformSubscription] = await Promise.all([
        getSubscriptionPlansPublicCached().catch(
          () => [] as Awaited<ReturnType<typeof listActiveSubscriptionPlansPublic>>,
        ),
        studentId ? loadStudentSubscription(studentId) : Promise.resolve(null),
      ]);
      return (
        <LazySection minHeight={480}>
          <div id="home-subscriptions" className="scroll-mt-24">
            <HomeSubscriptionsSection
              enabled
              plans={plans}
              isStudent={session?.user?.role === "STUDENT"}
              isLoggedIn={!!session}
              studentPlatformSubscription={studentPlatformSubscription}
            />
          </div>
        </LazySection>
      );
    }

    case "courses": {
      const [coursesRaw, categories, teachersForFilter] = await Promise.all([
        getPublishedCoursesForHomepageCached().catch(() => [] as HomepageCourseCard[]),
        getCategoriesCached().catch(() => [] as Awaited<ReturnType<typeof getCategories>>),
        homepageSettings.teachersEnabled
          ? getTeachersHomepagePreviewCached().catch(
              () => [] as Awaited<ReturnType<typeof listTeachersHomepagePreviewOnly>>,
            )
          : Promise.resolve([] as Awaited<ReturnType<typeof listTeachersHomepagePreviewOnly>>),
      ]);
      let courses = coursesRaw;
      if (homepageSettings.teachersEnabled && teachersForFilter.length > 0) {
        const teacherAccountIds = new Set(teachersForFilter.map((row) => row.id));
        courses = courses.filter((c) => !c.createdById || !teacherAccountIds.has(c.createdById));
      }

      const categoryIdToCourses = new Map<string, HomepageCourseCard[]>();
      const uncategorized: HomepageCourseCard[] = [];
      for (const c of courses) {
        const catId = c.category?.id;
        if (catId) {
          if (!categoryIdToCourses.has(catId)) categoryIdToCourses.set(catId, []);
          categoryIdToCourses.get(catId)!.push(c);
        } else {
          uncategorized.push(c);
        }
      }

      const courseSections: { title: string; slug?: string; courses: HomepageCourseCard[] }[] = [];
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
        courseSections.push({
          title: t("courses.allCoursesTitle", "All courses"),
          courses: uncategorized,
        });
      }
      if (!courseSections.length) return null;

      return (
        <>
          {courseSections.map((section, idx) => (
            <LazySection key={section.slug ?? `uncategorized-${idx}`} minHeight={420}>
              <section className="bg-white dark:bg-[var(--color-background)] mx-auto max-w-6xl px-4 py-16 sm:px-6">
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
                    {section.courses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={{
                          id: course.id,
                          title: course.title,
                          titleAr: course.titleAr,
                          slug: course.slug,
                          shortDesc: course.shortDesc,
                          shortDescEn: course.shortDescEn,
                          duration: course.duration,
                          level: course.level,
                          imageUrl: course.imageUrl,
                          price: course.price,
                          lessonsCount: course.lessonsCount,
                          instructorName: course.instructorName,
                          category: course.category
                            ? { name: course.category.name, nameAr: course.category.nameAr }
                            : null,
                        }}
                      />
                    ))}
                  </HorizontalScrollRow>
                </div>
              </section>
            </LazySection>
          ))}
        </>
      );
    }

    case "store":
    case "library": {
      if (!homepageSettings.storeEnabled) return null;
      const storeCount = await getStoreProductsCountPublicCached().catch(() => 0);
      if (storeCount <= 0) return null;
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
      const title =
        sectionType === "library"
          ? pickLocalizedText(locale, "المكتبة", "Library") || storeSectionTitle
          : storeSectionTitle;
      return (
        <LazySection minHeight={280}>
          <HomeStoreSection
            productsCount={storeCount}
            sectionTitle={title}
            sectionDescription={storeSectionDescription}
          />
        </LazySection>
      );
    }

    case "jobs": {
      const jobs = await getPublishedJobsForHomepageCached().catch(
        () => [] as Awaited<ReturnType<typeof listPublishedJobsForHomepage>>,
      );
      if (!jobs.length) return null;
      return (
        <LazySection minHeight={360}>
          <HomeJobsSection
            jobs={jobs}
            locale={locale === "en" ? "en" : "ar"}
            sectionTitle={t("home.jobsSectionTitle", "Jobs")}
            sectionDescription={t("home.jobsSectionDescription", "Browse open opportunities on the platform.")}
          />
        </LazySection>
      );
    }

    case "live": {
      const homeLiveStreams = (await getHomepageLiveStreamsCached().catch(() => [])) as HomeLiveStream[];
      if (!homeLiveStreams.length) return null;
      return (
        <LazySection minHeight={320}>
          <HomeLiveStreamsSection streams={homeLiveStreams} locale={locale === "en" ? "en" : "ar"} />
        </LazySection>
      );
    }

    case "news": {
      const slides = parsePlatformNewsItems(homepageSettings.platformNewsItems);
      if (!homepageSettings.platformNewsEnabled || !slides.length) return null;
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
      return (
        <LazySection minHeight={360}>
          <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-6 text-2xl font-bold text-[var(--color-foreground)]">{platformNewsTitle}</h2>
              <HomePlatformNewsSlider items={slides} />
            </div>
          </section>
        </LazySection>
      );
    }

    case "social":
      return <HomeSocialSection settings={homepageSettings} />;

    case "reviews": {
      const reviews = await getReviewsForHomepageCached().catch(
        () => [] as Awaited<ReturnType<typeof getReviews>>,
      );
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
          : rawReviewsSubtitle ||
            t("home.reviewsSubtitleDefault", "Real experiences from platform students");

      return (
        <LazySection minHeight={420}>
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
                          <div className="relative mt-4 aspect-video overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-black/5 dark:bg-white/5">
                            <OptimizedImage
                              src={r.imageUrl}
                              alt={`${t("home.reviewImageAltPrefix", "Review image from")} ${r.authorName}`}
                              fill
                              sizes="(max-width: 640px) 90vw, 360px"
                              className="object-contain"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-10 text-center text-[var(--color-muted)]">
                  {t("home.noReviewsYet", "No reviews yet.")}
                </p>
              )}
            </div>
          </section>
        </LazySection>
      );
    }

    case "policies":
      return <HomePolicyCardsSection policyCardsJson={homepageSettings.policyCardsJson} />;

    default:
      return null;
  }
}

export const DEFAULT_HOME_SECTION_ORDER = [
  "platform_details",
  "teachers",
  "subscriptions",
  "courses",
  "library",
  "jobs",
  "store",
  "live",
  "news",
  "social",
  "reviews",
  "policies",
] as const;

export function HomeSectionIslandFallback({ minHeight = 280 }: { minHeight?: number }) {
  return (
    <div
      className="animate-pulse bg-[var(--color-surface)]"
      style={{ minHeight }}
      aria-busy="true"
      aria-hidden
    />
  );
}
