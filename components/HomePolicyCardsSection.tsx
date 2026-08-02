import Link from "next/link";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { listPublishedPolicyCards, parsePolicyCards, policyPublicHref } from "@/lib/policy-cards";

export async function HomePolicyCardsSection({
  policyCardsJson,
}: {
  policyCardsJson?: string | null;
}) {
  const [locale, t] = await Promise.all([getLocaleFromCookie(), getServerTranslator()]);
  const cards = listPublishedPolicyCards(parsePolicyCards(policyCardsJson));
  if (cards.length === 0) return null;

  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
          {t("home.policiesTitle", "Site policies")}
        </h2>
        <p className="mt-1 text-[var(--color-muted)]">
          {t("home.policiesSubtitle", "Read our privacy, terms, and acceptable use policies.")}
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const title = pickLocalizedText(locale, card.titleAr, card.titleEn) || card.slug;
            const body = pickLocalizedText(locale, card.bodyAr, card.bodyEn) || "";
            const href = policyPublicHref(card);
            return (
              <Link
                key={card.id}
                href={href}
                className="group rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-card)] transition hover:border-[var(--color-primary)]/40"
              >
                <h3 className="text-lg font-bold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]">
                  {title}
                </h3>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-[var(--color-primary)]">
                  {t("home.readMore", "Read more")}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
