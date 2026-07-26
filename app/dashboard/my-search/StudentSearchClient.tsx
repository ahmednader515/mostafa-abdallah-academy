"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

type SearchResult = {
  courses: { id: string; title: string; titleAr: string | null; continueHref: string }[];
  products: { id: string; title: string }[];
  certificates: { id: string; title: string; href: string }[];
};

export function StudentSearchClient() {
  const t = useT();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch(`/api/dashboard/student/search?q=${encodeURIComponent(q)}`, {
      credentials: "include",
    });
    const d = await r.json().catch(() => ({}));
    setLoading(false);
    if (r.ok) setResult(d as SearchResult);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => void search(e)} className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("studentDash.searchPlaceholder", "Search courses, files, certificates…")}
          className="min-w-[220px] flex-1 rounded border border-[var(--color-border)] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {t("studentDash.search", "Search")}
        </button>
      </form>

      {result ? (
        <div className="space-y-6 text-sm">
          <section>
            <h3 className="mb-2 font-semibold">{t("studentDash.nav.courses", "My courses")}</h3>
            <ul className="space-y-1">
              {result.courses.map((c) => (
                <li key={c.id}>
                  <Link href={c.continueHref} className="underline">
                    {c.titleAr || c.title}
                  </Link>
                </li>
              ))}
              {result.courses.length === 0 ? (
                <li className="text-[var(--color-muted)]">—</li>
              ) : null}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 font-semibold">{t("studentDash.nav.library", "My library")}</h3>
            <ul className="space-y-1">
              {result.products.map((p) => (
                <li key={p.id}>{p.title}</li>
              ))}
              {result.products.length === 0 ? (
                <li className="text-[var(--color-muted)]">—</li>
              ) : null}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 font-semibold">{t("studentDash.certificates", "Certificates")}</h3>
            <ul className="space-y-1">
              {result.certificates.map((c) => (
                <li key={c.id}>
                  <Link href={c.href} className="underline">
                    {c.title}
                  </Link>
                </li>
              ))}
              {result.certificates.length === 0 ? (
                <li className="text-[var(--color-muted)]">—</li>
              ) : null}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
