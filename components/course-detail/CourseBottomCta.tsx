import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function CourseBottomCta({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
}: Props) {
  return (
    <section className="mt-16 border-t border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)]/10 via-[var(--color-surface)] to-[var(--color-background)]">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-[var(--color-foreground)]">{title}</h2>
          {subtitle ? (
            <p className="mt-2 max-w-xl text-[var(--color-muted)]">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={ctaHref}
            className="inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            {ctaLabel}
          </Link>
          {secondaryLabel && secondaryHref ? (
            <Link
              href={secondaryHref}
              className="inline-flex rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-foreground)] transition hover:bg-[var(--color-border)]/40"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
