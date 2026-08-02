import Link from "next/link";
import { notFound } from "next/navigation";
import { getHomepageSettings } from "@/lib/db";
import {
  findPublishedPolicyBySlug,
  parsePolicyCards,
  RESERVED_POLICY_SLUGS,
  sanitizePolicySlug,
} from "@/lib/policy-cards";
import { PolicyPageView } from "@/components/PolicyPageView";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug: raw } = await params;
  const slug = sanitizePolicySlug(decodeURIComponent(raw || ""));
  if (!slug || RESERVED_POLICY_SLUGS.has(slug)) return {};
  const settings = await getHomepageSettings().catch(() => null);
  const card = findPublishedPolicyBySlug(
    parsePolicyCards(settings?.policyCardsJson ?? null),
    slug,
  );
  if (!card) return {};
  const locale = await getLocaleFromCookie();
  const title = locale === "en" ? card.titleEn || card.titleAr : card.titleAr || card.titleEn;
  return { title: title || slug };
}

export default async function RootPolicySlugPage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = sanitizePolicySlug(decodeURIComponent(raw || ""));
  if (!slug || RESERVED_POLICY_SLUGS.has(slug)) notFound();

  const [locale, t, settings] = await Promise.all([
    getLocaleFromCookie(),
    getServerTranslator(),
    getHomepageSettings().catch(() => null),
  ]);
  const card = findPublishedPolicyBySlug(
    parsePolicyCards(settings?.policyCardsJson ?? null),
    slug,
  );
  if (!card) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t("policy.notFound", "Policy not found")}</h1>
        <Link href="/" className="mt-6 inline-block text-[var(--color-primary)] hover:underline">
          {t("common.home", "Home")}
        </Link>
      </div>
    );
  }

  return (
    <PolicyPageView card={card} locale={locale} homeLabel={t("common.home", "Home")} />
  );
}
