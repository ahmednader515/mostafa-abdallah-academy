import Link from "next/link";
import { notFound } from "next/navigation";
import { getConsultationById } from "@/lib/lms-features-db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
export default async function ConsultationDetail({ params }: { params: Promise<{ id: string }> }) {
  const offer = await getConsultationById((await params).id).catch(() => null);
  if (!offer || !offer.isPublished) notFound();
  const locale = await getLocaleFromCookie();
  return <article className="px-4 py-16"><div className="mx-auto max-w-3xl"><Link href="/consultations" className="text-[var(--color-primary)]">← Consultations</Link><h1 className="mt-6 text-3xl font-bold">{pickLocalizedText(locale, offer.titleAr, offer.title)}</h1><p className="mt-6 whitespace-pre-wrap">{pickLocalizedText(locale, offer.descriptionAr, offer.description)}</p>{offer.scheduleText ? <p className="mt-4 text-[var(--color-muted)]">{pickLocalizedText(locale, offer.scheduleTextAr, offer.scheduleText)}</p> : null}<p className="mt-4 font-semibold">{offer.price} EGP</p><Link href="/dashboard/messages" className="mt-6 inline-block rounded bg-[var(--color-primary)] px-5 py-3 font-semibold text-white">احجز الآن</Link></div></article>;
}
