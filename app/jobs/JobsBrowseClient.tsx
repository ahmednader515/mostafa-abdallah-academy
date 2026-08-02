"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { JobBoardCard } from "@/components/JobBoardCard";
import { useLocale, useT } from "@/components/LocaleProvider";
import { sortJobs, type JobSortKey } from "@/lib/jobs-format";
import type { JobCategory, JobPosting } from "@/lib/types";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

const PREVIEW = 8;

export function JobsBrowseClient({
  jobs,
  categories,
  heroImageUrl = "/images/jobs-hero.png",
}: {
  jobs: JobPosting[];
  categories: JobCategory[];
  heroImageUrl?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState("all");
  const [sort, setSort] = useState<JobSortKey>("newest");

  const categoryById = useMemo(() => {
    const m = new Map<string, JobCategory>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = jobs;
    if (categorySlug !== "all") {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) list = list.filter((j) => j.categoryId === cat.id);
    }
    if (q) {
      list = list.filter((j) => {
        const title = `${j.title} ${j.titleAr ?? ""} ${j.companyName ?? ""} ${j.location ?? ""} ${j.description} ${j.descriptionAr ?? ""}`.toLowerCase();
        return title.includes(q) || (j.skills ?? []).some((s) => s.toLowerCase().includes(q));
      });
    }
    return sortJobs(list, sort);
  }, [jobs, categories, categorySlug, query, sort]);

  const sections = useMemo(() => {
    const ordered = [...categories].sort((a, b) => a.order - b.order);
    const out: { key: string; label: string; href: string; items: JobPosting[] }[] = [];
    for (const cat of ordered) {
      const items = sortJobs(
        jobs.filter((j) => j.categoryId === cat.id),
        "newest",
      );
      if (!items.length) continue;
      out.push({
        key: cat.id,
        label: pickLocalizedText(locale, cat.nameAr, cat.name) || cat.name,
        href: `/jobs/category/${encodeURIComponent(cat.slug)}`,
        items,
      });
    }
    const uncategorized = sortJobs(
      jobs.filter((j) => !j.categoryId || !categoryById.has(j.categoryId)),
      "newest",
    );
    if (uncategorized.length) {
      out.push({
        key: "__uncategorized__",
        label: t("jobs.uncategorized", "Other opportunities"),
        href: "/jobs/category/uncategorized",
        items: uncategorized,
      });
    }
    return out;
  }, [jobs, categories, categoryById, locale, t]);

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <div className="bg-[#f5f7fa]" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImageUrl || "/images/jobs-hero.png"}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#001a3d]/90 via-[#001a3d]/75 to-[#001a3d]/55" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="max-w-2xl text-3xl font-black leading-tight text-white sm:text-5xl">
            {t("jobs.heroTitleLead", "Find your next")}{" "}
            <span className="text-[#ff9800]">{t("jobs.heroTitleAccent", "opportunity")}</span>
            {t("jobs.heroTitleTrail", "") ? <> {t("jobs.heroTitleTrail", "")}</> : null}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
            {t(
              "jobs.heroSubtitle",
              "Discover the latest jobs in tourism, travel, and aviation",
            )}
          </p>
          <form
            onSubmit={runSearch}
            className="mt-8 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row sm:items-center"
          >
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-[#001a3d] sm:w-44"
            >
              <option value="all">{t("jobs.allJobsFilter", "All jobs")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {pickLocalizedText(locale, c.nameAr, c.name) || c.name}
                </option>
              ))}
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                "jobs.searchPlaceholder",
                "Search by job title, company, or keyword...",
              )}
              className="min-w-0 flex-1 rounded-xl border border-transparent px-4 py-3 text-sm text-[#001a3d] outline-none focus:border-slate-200"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#ff9800] px-6 py-3 text-sm font-bold text-white hover:bg-[#f57c00]"
            >
              {t("jobs.searchBtn", "Search")}
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            {filtered.length === 1
              ? t("jobs.foundCountOne", "1 job found")
              : t("jobs.foundCount", "{count} jobs found").replace(
                  "{count}",
                  String(filtered.length),
                )}
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>{t("jobs.sortBy", "Sort by:")}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as JobSortKey)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-[#001a3d]"
            >
              <option value="newest">{t("jobs.sortNewest", "Newest")}</option>
              <option value="oldest">{t("jobs.sortOldest", "Oldest")}</option>
              <option value="salary_desc">{t("jobs.sortSalary", "Highest salary")}</option>
              <option value="popular">{t("jobs.sortPopular", "Most viewed")}</option>
            </select>
          </label>
        </div>

        {(query.trim() || categorySlug !== "all") && (
          <div className="mb-10 space-y-4">
            {filtered.length === 0 ? (
              <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">
                {t("jobs.emptySearch", "No matching results.")}
              </p>
            ) : (
              filtered.map((job) => <JobBoardCard key={job.id} job={job} layout="list" />)
            )}
          </div>
        )}

        {!query.trim() && categorySlug === "all" ? (
          sections.length === 0 ? (
            <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">
              {t("jobs.empty", "No open positions right now.")}
            </p>
          ) : (
            <div className="space-y-10">
              {sections.map((section) => (
                <section key={section.key} className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-[#001a3d]">{section.label}</h2>
                    <Link
                      href={section.href}
                      className="shrink-0 text-sm font-semibold text-[#ff9800] hover:underline"
                    >
                      {t("jobs.viewMore", "View more")}
                      <span aria-hidden className="ms-1 inline-block rtl:rotate-180">
                        →
                      </span>
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {section.items.slice(0, PREVIEW).map((job) => (
                      <JobBoardCard key={job.id} job={job} layout="list" />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
