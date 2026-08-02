import Link from "next/link";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import type { Locale } from "@/lib/i18n/types";
import type { PolicyCard } from "@/lib/policy-cards";

export function PolicyPageView({
  card,
  locale,
  homeLabel,
}: {
  card: PolicyCard;
  locale: Locale;
  homeLabel: string;
}) {
  const title = pickLocalizedText(locale, card.titleAr, card.titleEn) || card.slug;
  const body = pickLocalizedText(locale, card.bodyAr, card.bodyEn) || "";

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        ← {homeLabel}
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold text-[var(--color-foreground)]">{title}</h1>
      <div className="prose prose-slate mt-8 max-w-none whitespace-pre-wrap text-[var(--color-foreground)] dark:prose-invert">
        {body}
      </div>
    </article>
  );
}
