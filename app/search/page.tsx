import Link from "next/link";
import { searchPlatform, type PlatformSearchResult } from "@/lib/db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { fillMessage } from "@/lib/i18n/interpolate";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

const TYPE_ORDER: PlatformSearchResult["type"][] = ["section", "course", "teacher", "lecture", "library"];

function groupResults(results: PlatformSearchResult[]) {
  const map = new Map<PlatformSearchResult["type"], PlatformSearchResult[]>();
  for (const type of TYPE_ORDER) map.set(type, []);
  for (const r of results) {
    const list = map.get(r.type);
    if (list) list.push(r);
  }
  return TYPE_ORDER.map((type) => ({ type, items: map.get(type) ?? [] })).filter((g) => g.items.length > 0);
}

export default async function SearchPage({ searchParams }: Props) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? "";

  const typeLabels: Record<PlatformSearchResult["type"], string> = {
    section: t("search.typeSection", "الأقسام"),
    course: t("search.typeCourse", "الكورسات"),
    teacher: t("search.typeTeacher", "المدرسون"),
    lecture: t("search.typeLecture", "المحاضرات"),
    library: t("search.typeLibrary", "المكتبة"),
  };

  let results: PlatformSearchResult[] = [];
  if (q) {
    try {
      results = await searchPlatform(q);
    } catch {
      results = [];
    }
  }

  const groups = groupResults(results);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{t("search.pageTitle", "نتائج البحث")}</h1>
      {q ? (
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {fillMessage(t("search.queryLabel", "نتائج البحث عن: «{q}»"), { q })}
        </p>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t("search.emptyQuery", "أدخل كلمة بحث في الشريط العلوي.")}</p>
      )}

      {q && groups.length === 0 ? (
        <p className="mt-10 text-center text-[var(--color-muted)]">{t("search.noResults", "لا توجد نتائج مطابقة.")}</p>
      ) : null}

      <div className="mt-8 space-y-8">
        {groups.map(({ type, items }) => (
          <div key={type}>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{typeLabels[type]}</h2>
            <ul className="mt-3 divide-y divide-[var(--color-border)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {items.map((item) => (
                <li key={`${type}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-[var(--color-background)]"
                    dir={locale === "ar" ? "rtl" : "ltr"}
                  >
                    <span className="font-medium text-[var(--color-foreground)]">{item.title}</span>
                    <span className="shrink-0 text-[var(--color-primary)]">←</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
