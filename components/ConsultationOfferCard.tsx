"use client";

import Link from "next/link";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useCurrency } from "@/components/CurrencyProvider";
import { useT } from "@/components/LocaleProvider";

export type ConsultationCardData = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  scheduleText: string | null;
  price: number;
};

export function ConsultationOfferCard({ offer }: { offer: ConsultationCardData }) {
  const t = useT();
  const { formatPriceParts } = useCurrency();
  const priceParts = formatPriceParts(offer.price);
  const href = `/consultations/${encodeURIComponent(offer.id)}`;

  return (
    <article className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <Link href={href} className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-border)]" />
        {offer.imageUrl ? (
          <OptimizedImage
            src={offer.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, 384px"
            className="object-cover"
            quality={70}
          />
        ) : null}
        <div className="pointer-events-none absolute end-0 top-0 z-[1] origin-top-end translate-x-1/4 -translate-y-1/4 rotate-45 bg-[var(--color-primary)] px-10 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white shadow-md rtl:-translate-x-1/4 rtl:rotate-[-45deg]">
          {t("consultations.badge", "استشارة")}
        </div>
      </Link>

      <div className="relative z-[2] -mt-8 flex flex-1 flex-col rounded-t-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-6 pt-10 sm:px-6">
        <h3 className="text-xl font-bold leading-snug text-[var(--color-foreground)]">
          <Link href={href} className="hover:text-[var(--color-primary)]">
            {offer.title}
          </Link>
        </h3>
        {offer.description ? (
          <p className="mt-3 line-clamp-4 min-h-[4.5rem] text-sm leading-relaxed text-[var(--color-muted)]">
            {offer.description}
          </p>
        ) : (
          <p className="mt-3 min-h-[4.5rem] text-sm text-[var(--color-muted)]">
            {t("consultations.noDescription", "لا يوجد وصف بعد.")}
          </p>
        )}
        {offer.scheduleText ? (
          <p className="mt-3 text-xs font-medium text-[var(--color-primary)]">{offer.scheduleText}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-xs text-[var(--color-muted)]">{t("consultations.priceLabel", "السعر")}</p>
            <p className="text-lg font-bold text-[var(--color-foreground)]" dir="ltr">
              {priceParts.amount}{" "}
              <span className="text-sm font-semibold">{priceParts.code}</span>
            </p>
          </div>
          <Link
            href={href}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]"
          >
            {t("consultations.viewDetails", "عرض التفاصيل")}
          </Link>
        </div>
      </div>
    </article>
  );
}
