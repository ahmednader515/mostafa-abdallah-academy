import Link from "next/link";

type Props = {
  title: string;
  shortDescription: string;
  imageUrl: string | null;
  categoryName: string;
  languageLabel: string;
  lessonsCount: number;
  lessonsLabel: string;
  duration: string | null;
  levelLabel: string | null;
  backHref: string;
  backLabel: string;
  badge?: string | null;
  rating?: number | null;
  ratingCount?: number;
  ratingLabel?: string;
};

export function CourseDetailHero({
  title,
  shortDescription,
  imageUrl,
  categoryName,
  languageLabel,
  lessonsCount,
  lessonsLabel,
  duration,
  levelLabel,
  backHref,
  backLabel,
  badge,
  rating,
  ratingCount,
  ratingLabel,
}: Props) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#0f172a] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(56,189,248,0.25), transparent 55%), radial-gradient(ellipse 60% 50% at 90% 80%, rgba(99,102,241,0.2), transparent 50%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center lg:py-14">
        <div className="min-w-0">
          <Link href={backHref} className="text-sm font-medium text-white/70 transition hover:text-white">
            ← {backLabel}
          </Link>
          {categoryName ? (
            <p className="mt-4 text-sm font-medium text-sky-300">{categoryName}</p>
          ) : null}
          {badge ? (
            <span className="mt-3 inline-flex rounded bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-200">
              {badge}
            </span>
          ) : null}
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            {title}
          </h1>
          {shortDescription ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              {shortDescription}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white/90">{languageLabel}</span>
            <span className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white/90">
              {lessonsCount} {lessonsLabel}
            </span>
            {duration ? (
              <span className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white/90">{duration}</span>
            ) : null}
            {levelLabel ? (
              <span className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white/90">{levelLabel}</span>
            ) : null}
          </div>
          {rating != null && ratingCount != null && ratingCount > 0 && ratingLabel ? (
            <p className="mt-4 text-sm text-white/70">{ratingLabel}</p>
          ) : null}
        </div>
        <div className="relative aspect-video overflow-hidden rounded-xl bg-white/5 shadow-2xl ring-1 ring-white/10">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl opacity-40">📚</div>
          )}
        </div>
      </div>
    </section>
  );
}
