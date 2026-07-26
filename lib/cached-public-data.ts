import { unstable_cache } from "next/cache";
import {
  getCategories,
  getCoursesPublished,
  getPublishedCoursesForHomepage,
  getReviews,
  getReviewsForHomepage,
  listActiveSubscriptionPlansPublic,
  listStoreProductsPublic,
  countActiveStoreProductsPublic,
  listTeachersForHomepage,
  listTeachersHomepagePreviewOnly,
} from "@/lib/db";
import {
  getBrandAndAnalyticsSettings,
  getHomepageLiveStreams,
  getPlatformLabelsMap,
  getVisibleHomepageSections,
} from "@/lib/lms-spec-db";

/** مدة تخزين البيانات العامة مؤقتاً (ثوانٍ) */
export const PUBLIC_DATA_REVALIDATE = 60;

export const getBrandAndAnalyticsSettingsCached = unstable_cache(
  () => getBrandAndAnalyticsSettings(),
  ["brand-analytics-settings"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["homepage-settings"] },
);

export const getPlatformLabelsMapCached = unstable_cache(
  () => getPlatformLabelsMap().catch(() => ({} as Record<string, { ar: string; en: string }>)),
  ["platform-labels-map"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["platform-labels"] },
);

export const getPublishedCoursesCached = unstable_cache(
  () => getCoursesPublished(true),
  ["published-courses"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["courses"] },
);

/** Homepage-only: capped per category, no rating subqueries */
export const getPublishedCoursesForHomepageCached = unstable_cache(
  () => getPublishedCoursesForHomepage(8),
  ["homepage-courses-slim"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["courses"] },
);

export const getCategoriesCached = unstable_cache(
  () => getCategories(),
  ["categories"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["categories"] },
);

export const getReviewsCached = unstable_cache(
  () => getReviews(),
  ["reviews"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["reviews"] },
);

export const getReviewsForHomepageCached = unstable_cache(
  () => getReviewsForHomepage(6),
  ["homepage-reviews"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["reviews"] },
);

export const getTeachersForHomepageCached = unstable_cache(
  () => listTeachersForHomepage(),
  ["homepage-teachers"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["teachers"] },
);

export const getTeachersHomepagePreviewCached = unstable_cache(
  () => listTeachersHomepagePreviewOnly(4),
  ["homepage-teachers-preview"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["teachers"] },
);

export const getSubscriptionPlansPublicCached = unstable_cache(
  () => listActiveSubscriptionPlansPublic(),
  ["subscription-plans-public"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["subscriptions"] },
);

export const getStoreProductsPublicCached = unstable_cache(
  () => listStoreProductsPublic(),
  ["store-products-public"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["store"] },
);

export const getStoreProductsCountPublicCached = unstable_cache(
  () => countActiveStoreProductsPublic(),
  ["store-products-count-public"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["store"] },
);

export const getVisibleHomepageSectionsCached = unstable_cache(
  () => getVisibleHomepageSections(),
  ["homepage-sections"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["homepage-sections"] },
);

export const getHomepageLiveStreamsCached = unstable_cache(
  () => getHomepageLiveStreams(),
  ["homepage-live-streams"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["live-streams"] },
);

export const getEnabledSocialLinksCached = unstable_cache(
  async () => {
    const { listEnabledSocialLinks } = await import("@/lib/lms-spec-db");
    return listEnabledSocialLinks();
  },
  ["enabled-social-links"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["social-links"] },
);

export const getPublishedJobsForHomepageCached = unstable_cache(
  async () => {
    const { listPublishedJobsForHomepage } = await import("@/lib/db");
    return listPublishedJobsForHomepage(12);
  },
  ["homepage-jobs"],
  { revalidate: PUBLIC_DATA_REVALIDATE, tags: ["jobs"] },
);
