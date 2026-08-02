import { ConsultationOfferCard } from "@/components/ConsultationOfferCard";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { listPublishedConsultations } from "@/lib/lms-features-db";

export const dynamic = "force-dynamic";

export default async function ConsultationsPage() {
  const [offers, t, locale] = await Promise.all([
    listPublishedConsultations().catch(() => []),
    getServerTranslator(),
    getLocaleFromCookie(),
  ]);

  return (
    <section className="px-4 py-14 sm:px-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold leading-tight text-[var(--color-primary)] sm:text-5xl">
            {t("consultations.title", "حجز استشارة")}
          </h1>
          <svg
            className="mt-3 h-8 w-[17.5rem] text-[var(--color-primary)] sm:h-9 sm:w-[21rem]"
            viewBox="0 0 200 28"
            fill="none"
            aria-hidden
          >
            <path
              d="M4 20 Q 100 3 196 20"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
          <p className="mt-3 max-w-xl text-sm text-[var(--color-muted)]">
            {t(
              "consultations.subtitle",
              "اختر نوع الاستشارة المناسبة لك واحجز مباشرة عبر الرسائل مع فريق المنصة.",
            )}
          </p>
        </div>

        {offers.length === 0 ? (
          <p className="mt-14 text-center text-[var(--color-muted)]">
            {t("consultations.empty", "لا توجد استشارات متاحة حالياً.")}
          </p>
        ) : (
          <div className="mt-14 flex flex-wrap justify-center gap-8">
            {offers.map((offer) => (
              <ConsultationOfferCard
                key={offer.id}
                offer={{
                  id: offer.id,
                  title: pickLocalizedText(locale, offer.titleAr, offer.title) || offer.title,
                  description:
                    pickLocalizedText(locale, offer.descriptionAr, offer.description) || "",
                  imageUrl: offer.imageUrl,
                  scheduleText:
                    pickLocalizedText(locale, offer.scheduleTextAr, offer.scheduleText) || null,
                  price: offer.price,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
