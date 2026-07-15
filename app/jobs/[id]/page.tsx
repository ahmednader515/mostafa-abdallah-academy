import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobById } from "@/lib/db";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const job = await getJobById(id).catch(() => null);

  if (!job || !job.isPublished) notFound();

  const title = pickLocalizedText(locale, job.titleAr, job.title);
  const description = pickLocalizedText(locale, job.descriptionAr, job.description);

  return (
    <article className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/jobs" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          {t("jobs.backToJobs", "← Back to jobs")}
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-[var(--color-foreground)]">{title}</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
          {job.location ? <span>{job.location}</span> : null}
          {job.jobType ? <span>{job.jobType}</span> : null}
        </div>
        <div className="prose prose-sm mt-8 max-w-none whitespace-pre-wrap text-[var(--color-foreground)] dark:prose-invert">
          {description}
        </div>
      </div>
    </article>
  );
}
