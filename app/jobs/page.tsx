import Link from "next/link";
import { listPublishedJobs } from "@/lib/db";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";

export default async function JobsPage() {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const jobs = await listPublishedJobs().catch(() => []);

  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">{t("jobs.pageTitle", "Jobs")}</h1>
        <p className="mt-2 text-[var(--color-muted)]">{t("jobs.pageIntro", "Browse open positions and opportunities.")}</p>
        <div className="mt-8 space-y-4">
          {jobs.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">{t("jobs.empty", "No open positions right now.")}</p>
          ) : (
            jobs.map((job) => {
              const title = pickLocalizedText(locale, job.titleAr, job.title);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--color-primary)]/40"
                >
                  <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h2>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
                    {job.location ? <span>{job.location}</span> : null}
                    {job.jobType ? <span>{job.jobType}</span> : null}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
