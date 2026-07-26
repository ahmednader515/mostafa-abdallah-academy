import { notFound } from "next/navigation";
import { getExternalTrainingById } from "@/lib/lms-features-db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
export default async function ExternalTrainingDetail({ params }: { params: Promise<{ id: string }> }) {
  const page = await getExternalTrainingById((await params).id).catch(() => null);
  if (!page || !page.isPublished) notFound();
  const locale = await getLocaleFromCookie();
  return <article className="px-4 py-16"><div className="mx-auto max-w-3xl"><h1 className="text-3xl font-bold">{pickLocalizedText(locale, page.titleAr, page.title)}</h1><p className="mt-6 whitespace-pre-wrap">{pickLocalizedText(locale, page.descriptionAr, page.description)}</p><form action={`/api/external-training/${page.id}/launch`} method="post" className="mt-8"><button className="rounded bg-[var(--color-primary)] px-5 py-3 font-semibold text-white">ابدأ التدريب الآن</button></form></div></article>;
}
