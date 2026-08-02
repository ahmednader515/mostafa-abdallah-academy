import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById, incrementJobViewCount } from "@/lib/db";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import {
  formatJobLocationLabel,
  formatJobSalary,
  formatJobTypeLabel,
  jobBadgeClass,
  jobBadgeLabel,
} from "@/lib/jobs-format";
import { JobContactCopy } from "@/components/JobContactCopy";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const job = await getJobById(id).catch(() => null);

  if (!job || !job.isPublished) notFound();

  void incrementJobViewCount(job.id);

  const title = pickLocalizedText(locale, job.titleAr, job.title);
  const description = pickLocalizedText(locale, job.descriptionAr, job.description);
  const location = formatJobLocationLabel(job, locale);
  const jobType = formatJobTypeLabel(job, locale);
  const salary = formatJobSalary(job);
  const badge = jobBadgeLabel(job.badge, locale);

  return (
    <article className="min-h-screen bg-[#f5f7fa] px-4 py-12 sm:px-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl">
        <Link href="/jobs" className="text-sm font-medium text-[#ff9800] hover:underline">
          {t("jobs.backToJobs", "← Back to jobs")}
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {job.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.imageUrl} alt="" className="h-56 w-full object-cover" />
          ) : (
            <div className="h-40 bg-gradient-to-l from-[#001a3d] to-[#003366]" />
          )}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {badge ? (
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${jobBadgeClass(job.badge)}`}>
                    {badge}
                  </span>
                ) : null}
                <h1 className="mt-2 text-3xl font-black text-[#001a3d]">{title}</h1>
                {job.companyName ? (
                  <p className="mt-1 text-base font-medium text-sky-600">{job.companyName}</p>
                ) : null}
              </div>
              {salary ? (
                <p className="rounded-xl bg-[#001a3d]/5 px-4 py-2 text-sm font-bold text-[#001a3d]">
                  {salary}
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
              {location ? <span>📍 {location}</span> : null}
              {jobType ? <span>🕒 {jobType}</span> : null}
              {job.experienceLabel ? <span>📊 {job.experienceLabel}</span> : null}
            </div>

            {job.skills.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                    {s}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="prose prose-sm mt-8 max-w-none whitespace-pre-wrap text-slate-700 dark:prose-invert">
              {description}
            </div>

            <JobContactCopy
              phones={job.phones}
              email={job.email}
              showPhone={job.showPhone}
              showEmail={job.showEmail}
              contactOrder={job.contactOrder}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
