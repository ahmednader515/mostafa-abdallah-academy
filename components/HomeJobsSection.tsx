import Link from "next/link";
import { HorizontalScrollRow } from "@/components/HorizontalScrollRow";
import { OptimizedImage } from "@/components/OptimizedImage";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export type HomeJobCard = {
  id: string;
  title: string;
  titleAr: string | null;
  location: string | null;
  jobType: string | null;
  imageUrl?: string | null;
};

export function HomeJobsSection({
  jobs,
  locale,
  sectionTitle,
  sectionDescription,
}: {
  jobs: HomeJobCard[];
  locale: "ar" | "en";
  sectionTitle: string;
  sectionDescription?: string | null;
}) {
  if (jobs.length === 0) return null;

  return (
    <section className="border-t border-[var(--color-border)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-foreground)]">{sectionTitle}</h2>
            {sectionDescription ? (
              <p className="mt-1 max-w-2xl text-[var(--color-muted)]">{sectionDescription}</p>
            ) : null}
          </div>
          <Link
            href="/jobs"
            className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            {locale === "ar" ? "عرض المزيد" : "View more"}
          </Link>
        </div>
        <HorizontalScrollRow>
          {jobs.map((job) => {
            const title = pickLocalizedText(locale, job.titleAr, job.title) || job.title;
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex w-[260px] shrink-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition hover:border-[var(--color-primary)]/40"
              >
                <div className="relative aspect-[16/10] bg-[var(--color-border)]/40">
                  {job.imageUrl ? (
                    <OptimizedImage
                      src={job.imageUrl}
                      alt=""
                      fill
                      sizes="260px"
                      className="object-cover"
                      quality={70}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                      {locale === "ar" ? "وظيفة" : "Job"}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-base font-bold text-[var(--color-foreground)]">{title}</h3>
                  {job.location ? (
                    <p className="mt-2 text-xs text-[var(--color-muted)]">{job.location}</p>
                  ) : null}
                  {job.jobType ? (
                    <p className="mt-1 text-xs font-medium text-[var(--color-primary)]">{job.jobType}</p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </HorizontalScrollRow>
      </div>
    </section>
  );
}
