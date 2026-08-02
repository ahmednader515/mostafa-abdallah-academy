"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatJobLocationLabel,
  formatJobRelativeTime,
  formatJobSalary,
  formatJobTypeLabel,
  jobBadgeLabel,
} from "@/lib/jobs-format";
import type { JobPosting } from "@/lib/types";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { useLocale, useT } from "@/components/LocaleProvider";

/** تقريبًا سطران — بعدها يظهر «اقرأ المزيد» */
const DESC_PREVIEW_CHARS = 140;

const SKILL_STYLES = [
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-sky-50 text-sky-700",
  "bg-violet-50 text-violet-700",
  "bg-rose-50 text-rose-700",
];

function badgePillClass(badge: string | null | undefined): string {
  switch (badge) {
    case "new":
      return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100";
    case "remote":
      return "bg-sky-50 text-sky-600 ring-1 ring-sky-100";
    case "featured":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
    case "urgent":
      return "bg-red-50 text-red-600 ring-1 ring-red-100";
    default:
      return "bg-slate-50 text-slate-600 ring-1 ring-slate-100";
  }
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1M4 7h16a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 15v-4M12 15V8M16 15v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function JobBoardCard({
  job,
  layout = "list",
}: {
  job: JobPosting;
  layout?: "list" | "carousel";
}) {
  const t = useT();
  const locale = useLocale();
  const [descExpanded, setDescExpanded] = useState(false);
  const title = pickLocalizedText(locale, job.titleAr, job.title) || job.title;
  const description = pickLocalizedText(locale, job.descriptionAr, job.description) || "";
  const location = formatJobLocationLabel(job, locale) || "";
  const jobType = formatJobTypeLabel(job, locale) || "";
  const salary = formatJobSalary(job);
  const badge = jobBadgeLabel(job.badge, locale);
  const when = formatJobRelativeTime(job.createdAt, locale);
  const company = job.companyName?.trim() || "";
  const href = `/jobs/${job.id}`;
  const isCarousel = layout === "carousel";
  const descNeedsToggle = description.trim().length > DESC_PREVIEW_CHARS;
  const shownDescription =
    !descNeedsToggle || descExpanded
      ? description
      : `${description.trim().slice(0, DESC_PREVIEW_CHARS).trimEnd()}…`;

  const details = (
    <div className="min-w-0 flex-1">
      <div className="flex items-start gap-2">
        <BriefcaseIcon className="mt-1 h-5 w-5 shrink-0 text-[#1a237e]" />
        <div className="min-w-0">
          <h3 className="text-[1.05rem] font-bold leading-snug text-[#1a237e] sm:text-lg">{title}</h3>
          {company ? <p className="mt-1 text-sm font-medium text-[#1e88e5]">{company}</p> : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-slate-500">
        {location ? (
          <span className="inline-flex items-center gap-1.5">
            <PinIcon className="h-4 w-4 shrink-0" />
            {location}
          </span>
        ) : null}
        {jobType ? (
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4 shrink-0" />
            {jobType}
          </span>
        ) : null}
        {job.experienceLabel ? (
          <span className="inline-flex items-center gap-1.5">
            <ChartIcon className="h-4 w-4 shrink-0" />
            {job.experienceLabel}
          </span>
        ) : null}
      </div>

      {description ? (
        <div className="mt-3">
          <p
            className={`text-sm leading-relaxed text-slate-600 ${
              descExpanded ? "whitespace-pre-wrap" : ""
            }`}
          >
            {shownDescription}
          </p>
          {descNeedsToggle ? (
            <button
              type="button"
              onClick={() => setDescExpanded((v) => !v)}
              className="mt-1.5 text-sm font-semibold text-[#1e88e5] hover:underline"
            >
              {descExpanded
                ? t("jobs.readLess", "Show less")
                : t("jobs.readMore", "Read more")}
            </button>
          ) : null}
        </div>
      ) : null}

      {job.skills && job.skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {job.skills.map((skill, i) => (
            <span
              key={skill}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${SKILL_STYLES[i % SKILL_STYLES.length]}`}
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      {when ? <p className="mt-3 text-xs text-slate-400">{when}</p> : null}
    </div>
  );

  const branding = (
    <div className="flex w-[7.5rem] shrink-0 flex-col items-stretch sm:w-44">
      {badge ? (
        <span
          className={`mb-2 self-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badgePillClass(job.badge)}`}
        >
          {badge}
        </span>
      ) : (
        <span className="mb-2 h-5" />
      )}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
        {job.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={job.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-[#1a237e]/10 text-2xl font-bold text-[#1a237e]">
            {(company || title).slice(0, 1)}
          </span>
        )}
      </div>
      {company ? (
        <p className="mt-2 text-center text-[11px] font-semibold leading-tight text-slate-600">{company}</p>
      ) : null}
      {salary ? (
        <p className="mt-1.5 text-center text-xs font-bold text-[#1a237e] sm:text-sm" dir="ltr">
          {salary}
        </p>
      ) : null}
    </div>
  );

  const actions = (
    <div className="flex w-[7.5rem] shrink-0 flex-col items-stretch justify-center gap-2 border-s border-slate-100 ps-3 sm:w-36 sm:ps-4">
      <Link
        href={href}
        className="rounded-lg bg-[#1a237e] px-2 py-2.5 text-center text-xs font-bold text-white transition hover:bg-[#151b60] sm:px-3 sm:text-sm"
      >
        {t("jobs.applyNow", "Apply now")}
      </Link>
      <Link
        href={href}
        className="rounded-lg border border-slate-300 bg-white px-2 py-2.5 text-center text-xs font-semibold text-slate-700 transition hover:border-[#1a237e]/40 hover:text-[#1a237e] sm:px-3 sm:text-sm"
      >
        {t("jobs.viewDetails", "View details")}
      </Link>
      <button
        type="button"
        aria-label={t("jobs.saveJob", "Save job")}
        className="mx-auto mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-[#1a237e]"
      >
        <HeartIcon className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <article
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`flex w-full max-w-none flex-row items-stretch gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:shadow-md sm:gap-5 sm:p-5 ${
        isCarousel ? "shrink-0" : ""
      }`}
    >
      {details}
      {branding}
      {actions}
    </article>
  );
}
