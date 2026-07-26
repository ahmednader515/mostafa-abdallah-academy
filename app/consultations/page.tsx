import Link from "next/link";
import { listPublishedConsultations } from "@/lib/lms-features-db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export default async function ConsultationsPage() {
  const [offers, t, locale] = await Promise.all([
    listPublishedConsultations().catch(() => []),
    getServerTranslator(),
    getLocaleFromCookie(),
  ]);
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">{t("consultations.title", "Consultations")}</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={`/consultations/${offer.id}`}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <h2 className="text-xl font-semibold">
                {pickLocalizedText(locale, offer.titleAr, offer.title)}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm text-[var(--color-muted)]">
                {pickLocalizedText(locale, offer.descriptionAr, offer.description)}
              </p>
              <p className="mt-4 text-sm">{offer.price} EGP</p>
            </Link>
          ))}
        </div>
        {offers.length === 0 ? (
          <p className="mt-6 text-[var(--color-muted)]">
            {t("consultations.empty", "No consultations available.")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
