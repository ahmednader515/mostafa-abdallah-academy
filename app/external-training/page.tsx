import Link from "next/link";
import { listPublishedExternalTrainings } from "@/lib/lms-features-db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
export default async function ExternalTrainingPage() {
  const [pages, locale] = await Promise.all([listPublishedExternalTrainings().catch(() => []), getLocaleFromCookie()]);
  return <section className="px-4 py-16"><div className="mx-auto max-w-6xl"><h1 className="text-3xl font-bold">التدريب الخارجي</h1><div className="mt-8 grid gap-5 md:grid-cols-3">{pages.map((page) => <Link href={`/external-training/${page.id}`} key={page.id} className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5"><h2 className="text-xl font-semibold">{pickLocalizedText(locale, page.titleAr, page.title)}</h2><p className="mt-2 text-sm text-[var(--color-muted)]">{pickLocalizedText(locale, page.descriptionAr, page.description)}</p></Link>)}</div></div></section>;
}
