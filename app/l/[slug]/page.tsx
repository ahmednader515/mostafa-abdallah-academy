import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { unstable_noStore } from "next/cache";
import { authOptions } from "@/lib/auth";
import { LandingVisitTracker } from "@/components/landing/LandingVisitTracker";
import { SectionRenderer } from "@/components/landing/SectionRenderer";
import {
  getCourseById,
  getStoreProductById,
  getSubscriptionPlanById,
} from "@/lib/db";
import { getLandingPageBySlug } from "@/lib/landing-pages-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

function siteOrigin(): string {
  const primary = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN?.trim();
  if (primary) {
    return primary.startsWith("http")
      ? primary.replace(/\/$/, "")
      : `https://${primary.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  unstable_noStore();
  const { slug: raw } = await params;
  let slug = raw;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    /* keep */
  }
  const page = await getLandingPageBySlug(slug, { allowUnpublished: true });
  if (!page) return { title: "Landing page" };
  const title = page.metaTitle || page.internalName;
  const description = page.metaDescription || undefined;
  const og = page.ogImageUrl || undefined;
  return {
    title,
    description,
    keywords: page.metaKeywords || undefined,
    openGraph: {
      title,
      description,
      url: `${siteOrigin()}/l/${page.slug}`,
      images: og ? [{ url: og }] : undefined,
    },
  };
}

async function resolveTargetPrice(
  type: string,
  id: string | null,
): Promise<number | null> {
  if (!id) return null;
  try {
    if (type === "course") {
      const c = await getCourseById(id);
      return c ? Number((c as { price?: string | number }).price ?? 0) : null;
    }
    if (type === "subscription" || type === "library_plan") {
      const p = await getSubscriptionPlanById(id);
      return p ? Number(p.price ?? 0) : null;
    }
    if (type === "store_product") {
      const p = await getStoreProductById(id);
      return p ? p.price : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default async function PublicLandingPage({ params, searchParams }: Props) {
  unstable_noStore();
  const { slug: raw } = await params;
  const sp = await searchParams;
  let slug = raw;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    /* keep */
  }

  const preview = sp.preview === "1";
  const session = preview ? await getServerSession(authOptions) : null;
  const isStaff =
    session &&
    (session.user.role === "ADMIN" || session.user.role === "ASSISTANT_ADMIN");

  const page = preview && isStaff
    ? await getLandingPageBySlug(slug, { allowUnpublished: true })
    : await getLandingPageBySlug(slug);

  if (!page) notFound();

  let courseSlugById: Record<string, string> = {};
  const courseIds = new Set<string>();
  if (page.ctaTargetType === "course" && page.ctaTargetId) {
    courseIds.add(page.ctaTargetId);
  }
  for (const section of page.sections) {
    const buttons =
      section.type === "hero" || section.type === "pricing" || section.type === "signup"
        ? section.buttons
        : [];
    for (const btn of buttons) {
      if (btn.action === "course" && btn.targetId) courseIds.add(btn.targetId);
    }
  }
  await Promise.all(
    [...courseIds].map(async (cid) => {
      try {
        const c = await getCourseById(cid);
        const slug = (c as { slug?: string } | null)?.slug;
        if (slug) courseSlugById[cid] = String(slug);
      } catch {
        /* ignore */
      }
    }),
  );

  const targetPrice = await resolveTargetPrice(page.ctaTargetType, page.ctaTargetId);

  return (
    <>
      <LandingVisitTracker slug={page.slug} />
      <SectionRenderer
        sections={page.sections}
        theme={page.theme}
        pageSlug={page.slug}
        pageTargetType={page.ctaTargetType}
        pageTargetId={page.ctaTargetId}
        courseSlugById={courseSlugById}
        targetPrice={targetPrice}
      />
    </>
  );
}
