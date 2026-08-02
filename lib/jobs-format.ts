import type { JobPosting } from "@/lib/types";

export type JobSortKey = "newest" | "oldest" | "salary_desc" | "popular";

export function formatJobSalary(job: Pick<JobPosting, "salaryMin" | "salaryMax" | "salaryLabel">): string | null {
  if (job.salaryLabel?.trim()) return job.salaryLabel.trim();
  const min = job.salaryMin != null && Number.isFinite(job.salaryMin) ? job.salaryMin : null;
  const max = job.salaryMax != null && Number.isFinite(job.salaryMax) ? job.salaryMax : null;
  if (min != null && max != null) {
    return `${min.toLocaleString("en-EG")} - ${max.toLocaleString("en-EG")} ج.م`;
  }
  if (min != null) return `${min.toLocaleString("en-EG")} ج.م`;
  if (max != null) return `${max.toLocaleString("en-EG")} ج.م`;
  return null;
}

export function formatJobRelativeTime(iso: string, locale: "ar" | "en"): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return locale === "ar" ? "الآن" : "Just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return locale === "ar" ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return locale === "ar" ? `منذ ${hours} ساعة` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) {
    if (locale === "ar") {
      if (days === 1) return "منذ يوم واحد";
      if (days === 2) return "منذ يومين";
      return `منذ ${days} أيام`;
    }
    return days === 1 ? "1 day ago" : `${days}d ago`;
  }
  const months = Math.floor(days / 30);
  if (locale === "ar") {
    if (months === 1) return "منذ شهر";
    if (months === 2) return "منذ شهرين";
    return `منذ ${months} أشهر`;
  }
  return `${months}mo ago`;
}

export function sortJobs<T extends JobPosting>(jobs: T[], sort: JobSortKey): T[] {
  const list = [...jobs];
  switch (sort) {
    case "oldest":
      return list.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    case "salary_desc": {
      const score = (j: JobPosting) => j.salaryMax ?? j.salaryMin ?? -1;
      return list.sort((a, b) => score(b) - score(a) || String(b.createdAt).localeCompare(String(a.createdAt)));
    }
    case "popular":
      return list.sort(
        (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0) || String(b.createdAt).localeCompare(String(a.createdAt)),
      );
    case "newest":
    default:
      return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
}

export function jobBadgeLabel(badge: string | null | undefined, locale: "ar" | "en"): string | null {
  if (!badge) return null;
  const map: Record<string, { ar: string; en: string }> = {
    featured: { ar: "مميز", en: "Featured" },
    new: { ar: "جديد", en: "New" },
    remote: { ar: "عن بعد", en: "Remote" },
    urgent: { ar: "عاجل", en: "Urgent" },
  };
  const hit = map[badge];
  if (!hit) return badge;
  return locale === "ar" ? hit.ar : hit.en;
}

/** Common free-text job types / locations entered in one language. */
const JOB_TYPE_I18N: Record<string, { ar: string; en: string }> = {
  "full-time": { ar: "دوام كامل", en: "Full-time" },
  "full time": { ar: "دوام كامل", en: "Full-time" },
  "دوام كامل": { ar: "دوام كامل", en: "Full-time" },
  "part-time": { ar: "دوام جزئي", en: "Part-time" },
  "part time": { ar: "دوام جزئي", en: "Part-time" },
  "دوام جزئي": { ar: "دوام جزئي", en: "Part-time" },
  contract: { ar: "عقد", en: "Contract" },
  عقد: { ar: "عقد", en: "Contract" },
  internship: { ar: "تدريب", en: "Internship" },
  تدريب: { ar: "تدريب", en: "Internship" },
  remote: { ar: "عن بعد", en: "Remote" },
  "عن بعد": { ar: "عن بعد", en: "Remote" },
};

const LOCATION_I18N: Record<string, { ar: string; en: string }> = {
  giza: { ar: "الجيزة", en: "Giza" },
  الجيزة: { ar: "الجيزة", en: "Giza" },
  الجيزه: { ar: "الجيزة", en: "Giza" },
  cairo: { ar: "القاهرة", en: "Cairo" },
  القاهرة: { ar: "القاهرة", en: "Cairo" },
  alexandria: { ar: "الإسكندرية", en: "Alexandria" },
  الإسكندرية: { ar: "الإسكندرية", en: "Alexandria" },
  الاسكندرية: { ar: "الإسكندرية", en: "Alexandria" },
};

function lookupI18nPair(
  value: string | null | undefined,
  table: Record<string, { ar: string; en: string }>,
  locale: "ar" | "en",
): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const hit = table[raw.toLowerCase()] ?? table[raw];
  if (!hit) return raw;
  return locale === "ar" ? hit.ar : hit.en;
}

export function formatJobTypeLabel(
  job: Pick<JobPosting, "jobType" | "jobTypeAr" | "jobTypeEn">,
  locale: "ar" | "en",
): string | null {
  const preferred =
    locale === "en"
      ? (job.jobTypeEn || job.jobType || job.jobTypeAr || "").trim()
      : (job.jobTypeAr || job.jobType || job.jobTypeEn || "").trim();
  if (!preferred) return null;
  return lookupI18nPair(preferred, JOB_TYPE_I18N, locale);
}

export function formatJobLocationLabel(
  job: Pick<JobPosting, "location" | "locationEn">,
  locale: "ar" | "en",
): string | null {
  const preferred =
    locale === "en"
      ? (job.locationEn || job.location || "").trim()
      : (job.location || job.locationEn || "").trim();
  if (!preferred) return null;
  return lookupI18nPair(preferred, LOCATION_I18N, locale);
}

export function jobBadgeClass(badge: string | null | undefined): string {
  switch (badge) {
    case "featured":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
    case "new":
      return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100";
    case "remote":
      return "bg-sky-50 text-sky-600 ring-1 ring-sky-100";
    case "urgent":
      return "bg-red-50 text-red-600 ring-1 ring-red-100";
    default:
      return "bg-slate-50 text-slate-600 ring-1 ring-slate-100";
  }
}

export function slugifyJobCategory(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `cat-${Date.now().toString(36)}`;
}
