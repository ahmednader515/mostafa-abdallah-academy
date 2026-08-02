import Link from "next/link";
import { searchPlatform, type PlatformSearchResult } from "@/lib/db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { fillMessage } from "@/lib/i18n/interpolate";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-amber-200/80 px-0.5 text-inherit dark:bg-amber-500/30">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";

  const typeLabels: Record<string, string> = {
    section: t("search.typeSection", "Sections"),
    course: t("search.typeCourse", "Course"),
    teacher: t("search.typeTeacher", "Trainer"),
    lecture: t("search.typeLecture", "Lecture"),
    library: t("search.typeLibrary", "Library"),
    job: t("search.typeJob", "Job"),
    forum: t("search.typeForum", "Forum"),
    live: t("search.typeLive", "Live Session"),
    consultation: t("search.typeConsultation", "Consultation"),
  };

  let results: PlatformSearchResult[] = [];
  if (q) {
    try {
      results = await searchPlatform(q);
    } catch {
      results = [];
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("search.pageTitle", "نتائج البحث")}</h1>
      {q ? (
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {fillMessage(t("search.queryLabel", "نتائج البحث عن: «{q}»"), { q })}
        </p>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t("search.emptyQuery", "أدخل كلمة بحث في الشريط العلوي.")}</p>
      )}

      {q && results.length === 0 ? (
        <p className="mt-10 text-center text-[var(--color-muted)]">{t("search.noResults", "لا توجد نتائج مطابقة.")}</p>
      ) : null}

      <div className="mt-8 space-y-4">
        {results.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            href={item.href}
            className="block rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 shadow-[var(--shadow-card)] transition hover:border-[var(--color-primary)]/40"
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
              {typeLabels[item.type] || item.type}
            </div>
            <div className="mt-2 text-xl font-bold text-[var(--color-foreground)]">
              {highlight(item.title, q)}
            </div>
            {"snippet" in item && (item as { snippet?: string }).snippet ? (
              <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">
                {String((item as { snippet?: string }).snippet)}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
