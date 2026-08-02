import type { MetadataRoute } from "next";
import {
  getCategories,
  getCoursesPublished,
  getHomepageSettings,
  listActiveSubscriptionPlansPublic,
  listJobCategories,
  listLibraryCategoriesAll,
  listPublishedJobs,
  listStoreProductsPublic,
} from "@/lib/db";
import { listForumThreads } from "@/lib/forum-db";
import { listPublishedLandingPagesForSitemap } from "@/lib/landing-pages-db";
import { listPublishedConsultations, listPublishedExternalTrainings } from "@/lib/lms-features-db";
import { getHomepageLiveStreams } from "@/lib/lms-spec-db";
import {
  listPublishedPolicyCards,
  parsePolicyCards,
  policyPublicHref,
} from "@/lib/policy-cards";
import { DEFAULT_PRODUCTION_SITE_ORIGIN, getSiteOrigin } from "@/lib/site-url";

/** Rebuild at most every hour so new published content appears without redeploy. */
export const revalidate = 3600;

/** Sitemap must match the Google Search Console property (www.worldway.net). */
function sitemapBaseOrigin(): string {
  const origin = getSiteOrigin();
  if (origin.includes("localhost")) return origin;
  return DEFAULT_PRODUCTION_SITE_ORIGIN;
}

function asDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function entry(
  base: string,
  path: string,
  opts?: {
    lastModified?: Date;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  },
): MetadataRoute.Sitemap[number] {
  const normalized = path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return {
    url: `${base}${normalized === "/" ? "/" : normalized}`,
    lastModified: opts?.lastModified ?? new Date(),
    changeFrequency: opts?.changeFrequency ?? "weekly",
    priority: opts?.priority ?? 0.6,
  };
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = sitemapBaseOrigin();
  const now = new Date();

  const staticPaths: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/courses", changeFrequency: "daily", priority: 0.9 },
    { path: "/teachers", changeFrequency: "weekly", priority: 0.8 },
    { path: "/library", changeFrequency: "daily", priority: 0.8 },
    { path: "/jobs", changeFrequency: "daily", priority: 0.8 },
    { path: "/forum", changeFrequency: "daily", priority: 0.9 },
    { path: "/subscriptions", changeFrequency: "weekly", priority: 0.85 },
    { path: "/exams", changeFrequency: "weekly", priority: 0.7 },
    { path: "/certificates", changeFrequency: "weekly", priority: 0.6 },
    { path: "/consultations", changeFrequency: "weekly", priority: 0.7 },
    { path: "/live", changeFrequency: "daily", priority: 0.7 },
    { path: "/external-training", changeFrequency: "weekly", priority: 0.7 },
    { path: "/search", changeFrequency: "monthly", priority: 0.4 },
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((p) =>
    entry(base, p.path, {
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    }),
  );

  const [
    courses,
    courseCategories,
    jobs,
    jobCategories,
    libraryProducts,
    libraryCategories,
    forumThreads,
    consultations,
    externalTrainings,
    landingPages,
    homepage,
    subscriptionPlans,
    liveStreams,
  ] = await Promise.all([
    safe(() => getCoursesPublished(false), []),
    safe(() => getCategories(), []),
    safe(() => listPublishedJobs(), []),
    safe(() => listJobCategories(), []),
    safe(() => listStoreProductsPublic(), []),
    safe(() => listLibraryCategoriesAll(), []),
    safe(() => listForumThreads(null, 5000), []),
    safe(() => listPublishedConsultations(), []),
    safe(() => listPublishedExternalTrainings(), []),
    safe(() => listPublishedLandingPagesForSitemap(), []),
    safe(() => getHomepageSettings(), null),
    safe(() => listActiveSubscriptionPlansPublic(), []),
    safe(() => getHomepageLiveStreams(), []),
  ]);

  for (const cat of courseCategories) {
    const slug = String(cat.slug || "").trim();
    if (!slug) continue;
    entries.push(
      entry(base, `/courses/category/${encodeURIComponent(slug)}`, {
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.75,
      }),
    );
  }

  for (const course of courses) {
    const slug = String(course.slug || course.id || "").trim();
    if (!slug) continue;
    entries.push(
      entry(base, `/courses/${encodeURIComponent(slug)}`, {
        lastModified: asDate(
          (course as { updatedAt?: unknown; updated_at?: unknown; createdAt?: unknown; created_at?: unknown })
            .updatedAt ??
            (course as { updated_at?: unknown }).updated_at ??
            (course as { createdAt?: unknown }).createdAt ??
            (course as { created_at?: unknown }).created_at,
        ),
        changeFrequency: "weekly",
        priority: 0.85,
      }),
    );
  }

  for (const cat of jobCategories) {
    const slug = String(cat.slug || "").trim();
    if (!slug) continue;
    entries.push(
      entry(base, `/jobs/category/${encodeURIComponent(slug)}`, {
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      }),
    );
  }

  for (const job of jobs) {
    const id = String(job.id || "").trim();
    if (!id) continue;
    entries.push(
      entry(base, `/jobs/${encodeURIComponent(id)}`, {
        lastModified: asDate(job.updatedAt ?? job.createdAt),
        changeFrequency: "weekly",
        priority: 0.7,
      }),
    );
  }

  for (const cat of libraryCategories) {
    const slug = String(cat.slug || "").trim();
    if (!slug) continue;
    entries.push(
      entry(base, `/library/category/${encodeURIComponent(slug)}`, {
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      }),
    );
  }

  // Library detail pages exist for articles (see app/library/[id]/page.tsx).
  for (const product of libraryProducts) {
    if (product.contentType !== "article") continue;
    const id = String(product.id || "").trim();
    if (!id) continue;
    entries.push(
      entry(base, `/library/${encodeURIComponent(id)}`, {
        lastModified: asDate(product.createdAt),
        changeFrequency: "weekly",
        priority: 0.65,
      }),
    );
  }

  // Forum hub (/forum) + every thread detail page.
  for (const thread of forumThreads) {
    const id = String(thread.id || "").trim();
    if (!id) continue;
    entries.push(
      entry(base, `/forum/${encodeURIComponent(id)}`, {
        lastModified: asDate(thread.updatedAt ?? thread.createdAt ?? thread.lastReplyAt),
        changeFrequency: "daily",
        priority: 0.55,
      }),
    );
  }

  for (const item of consultations) {
    const id = String(item.id || "").trim();
    if (!id) continue;
    entries.push(
      entry(base, `/consultations/${encodeURIComponent(id)}`, {
        lastModified: asDate(item.updatedAt ?? item.createdAt),
        changeFrequency: "weekly",
        priority: 0.65,
      }),
    );
  }

  for (const item of externalTrainings) {
    const id = String(item.id || "").trim();
    if (!id) continue;
    entries.push(
      entry(base, `/external-training/${encodeURIComponent(id)}`, {
        lastModified: asDate(item.updatedAt ?? item.createdAt),
        changeFrequency: "weekly",
        priority: 0.65,
      }),
    );
  }

  for (const plan of subscriptionPlans) {
    const id = String(plan.id || "").trim();
    if (!id) continue;
    entries.push(
      entry(base, `/subscriptions/${encodeURIComponent(id)}`, {
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.75,
      }),
    );
  }

  for (const stream of liveStreams) {
    const raw = stream as Record<string, unknown>;
    const id = String(raw.id ?? "").trim();
    if (!id) continue;
    entries.push(
      entry(base, `/live/${encodeURIComponent(id)}`, {
        lastModified: asDate(raw.updatedAt ?? raw.updated_at ?? raw.createdAt ?? raw.created_at),
        changeFrequency: "daily",
        priority: 0.6,
      }),
    );
  }

  for (const page of landingPages) {
    const slug = String(page.slug || "").trim();
    if (!slug) continue;
    entries.push(
      entry(base, `/l/${encodeURIComponent(slug)}`, {
        lastModified: asDate(page.updatedAt),
        changeFrequency: "weekly",
        priority: 0.8,
      }),
    );
  }

  const policyCards = listPublishedPolicyCards(
    parsePolicyCards(homepage?.policyCardsJson ?? null),
  );
  for (const card of policyCards) {
    entries.push(
      entry(base, policyPublicHref(card), {
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      }),
    );
  }

  // Deduplicate by URL.
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });
}
