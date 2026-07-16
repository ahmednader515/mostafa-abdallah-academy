import { unstable_cache } from "next/cache";
import {
  getCategories,
  getCoursesPublished,
  getReviews,
  listActiveSubscriptionPlansPublic,
  listStoreProductsPublic,
  listTeachersForHomepage,
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

export const getTeachersForHomepageCached = unstable_cache(
  () => listTeachersForHomepage(),
  ["homepage-teachers"],
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
