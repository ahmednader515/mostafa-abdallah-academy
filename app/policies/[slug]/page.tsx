import Link from "next/link";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { getHomepageSettings } from "@/lib/db";
import { parsePolicyCards, type PolicyCard } from "@/lib/policy-cards";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [locale, t, settings] = await Promise.all([
    getLocaleFromCookie(),
    getServerTranslator(),
    getHomepageSettings().catch(() => null),
  ]);
  const cards = parsePolicyCards(settings?.policyCardsJson ?? null);
  const card = cards.find((c) => c.slug === slug && c.isVisible !== false) as PolicyCard | undefined;

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

  const title = pickLocalizedText(locale, card.titleAr, card.titleEn) || card.slug;
  const body = pickLocalizedText(locale, card.bodyAr, card.bodyEn) || "";

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-[var(--color-foreground)]">{title}</h1>
      <div className="prose prose-slate mt-8 max-w-none whitespace-pre-wrap text-[var(--color-foreground)] dark:prose-invert">
        {body}
      </div>
    </article>
  );
}
