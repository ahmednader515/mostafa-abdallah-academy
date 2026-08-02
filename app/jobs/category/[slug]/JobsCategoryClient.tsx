"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { JobBoardCard } from "@/components/JobBoardCard";
import { useLocale, useT } from "@/components/LocaleProvider";
import { sortJobs, type JobSortKey } from "@/lib/jobs-format";
import type { JobPosting } from "@/lib/types";

const PAGE = 10;

export function JobsCategoryClient({
  title,
  jobs,
}: {
  title: string;
  jobs: JobPosting[];
}) {
  const t = useT();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<JobSortKey>("newest");
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = jobs;
    if (q) {
      list = list.filter((j) => {
        const hay = `${j.title} ${j.titleAr ?? ""} ${j.companyName ?? ""} ${j.location ?? ""}`.toLowerCase();
        return hay.includes(q) || (j.skills ?? []).some((s) => s.toLowerCase().includes(q));
      });
    }
    return sortJobs(list, sort);
  }, [jobs, query, sort]);

  const pageItems = filtered.slice(0, visible);

  return (
    <div className="min-h-screen bg-[#f5f7fa]" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="border-b border-slate-200 bg-[#001a3d] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Link href="/jobs" className="text-sm font-medium text-[#ff9800] hover:underline">
            {t("jobs.backToJobs", "← Back to jobs")}
          </Link>
          <h1 className="mt-3 text-3xl font-black text-white">{title}</h1>
          <p className="mt-2 text-sm text-white/75">
            {t("jobs.categoryIntro", "All jobs in this category — search and sort results.")}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(PAGE);
            }}
            placeholder={t("jobs.searchInCategory", "Search in this category...")}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm"
          />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as JobSortKey);
              setVisible(PAGE);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="newest">{t("jobs.sortNewest", "Newest")}</option>
            <option value="oldest">{t("jobs.sortOldest", "Oldest")}</option>
            <option value="salary_desc">{t("jobs.sortSalary", "Highest salary")}</option>
            <option value="popular">{t("jobs.sortPopular", "Most viewed")}</option>
          </select>
        </div>

        <p className="mb-4 text-sm text-slate-600">
          {filtered.length === 1
            ? t("jobs.foundCountOne", "1 job found")
            : t("jobs.foundCount", "{count} jobs found").replace(
                "{count}",
                String(filtered.length),
              )}
        </p>

        {pageItems.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">
            {t("jobs.emptySearch", "No matching results.")}
          </p>
        ) : (
          <div className="space-y-4">
            {pageItems.map((job) => (
              <JobBoardCard key={job.id} job={job} layout="list" />
            ))}
          </div>
        )}

        {visible < filtered.length ? (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisible((n) => n + PAGE)}
              className="rounded-lg border border-[#001a3d] px-6 py-2.5 text-sm font-semibold text-[#001a3d] hover:bg-[#001a3d] hover:text-white"
            >
              {t("jobs.loadMore", "Load more")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
