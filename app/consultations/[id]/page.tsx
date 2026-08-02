import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { BookConsultationButton } from "@/components/BookConsultationButton";
import { OptimizedImage } from "@/components/OptimizedImage";
import { authOptions } from "@/lib/auth";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { getConsultationById } from "@/lib/lms-features-db";

export const dynamic = "force-dynamic";

export default async function ConsultationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [offer, locale, t, session] = await Promise.all([
    getConsultationById(id).catch(() => null),
    getLocaleFromCookie(),
    getServerTranslator(),
    getServerSession(authOptions),
  ]);

  if (!offer || !offer.isPublished) notFound();

  const title = pickLocalizedText(locale, offer.titleAr, offer.title) || offer.title;
  const description =
    pickLocalizedText(locale, offer.descriptionAr, offer.description) || "";
  const schedule =
    pickLocalizedText(locale, offer.scheduleTextAr, offer.scheduleText) || "";

  return (
    <article className="px-4 py-12 sm:px-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl">
        <Link
          href="/consultations"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {t("consultations.backToList", "← العودة للاستشارات")}
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-border)]">
            {offer.imageUrl ? (
              <OptimizedImage
                src={offer.imageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                quality={75}
              />
            ) : null}
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-black text-[var(--color-foreground)]">{title}</h1>
            {schedule ? (
              <p className="mt-3 text-sm font-medium text-[var(--color-primary)]">{schedule}</p>
            ) : null}
            {description ? (
              <p className="mt-6 whitespace-pre-wrap text-[var(--color-foreground)] leading-relaxed">
                {description}
              </p>
            ) : null}
            <p className="mt-6 text-lg font-bold text-[var(--color-foreground)]" dir="ltr">
              {offer.price} EGP
            </p>
            <div className="mt-6">
              <BookConsultationButton
                offerId={offer.id}
                isLoggedIn={Boolean(session?.user?.id)}
              />
            </div>
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              {t(
                "consultations.bookHint",
                "عند الحجز تُرسل رسالة مباشرة لفريق المنصة لمتابعة موعد الاستشارة.",
              )}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
