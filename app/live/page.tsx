import Link from "next/link";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { getHomepageLiveStreams } from "@/lib/lms-spec-db";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export default async function LiveStreamsPage() {
  const [locale, t, streams] = await Promise.all([
    getLocaleFromCookie(),
    getServerTranslator(),
    getHomepageLiveStreams().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-[var(--color-foreground)]">
        {t("live.title", "Live streams")}
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        {t("live.subtitle", "Upcoming and featured live sessions.")}
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {streams.map((raw) => {
          const s = raw as Record<string, unknown>;
          const id = String(s.id ?? "");
          const title = pickLocalizedText(
            locale,
            (s.titleAr as string) || (s.title_ar as string) || null,
            (s.title as string) || (s.titleEn as string) || null,
          ) || String(s.title ?? "Live");
          const image = (s.thumbnailUrl || s.thumbnail_url || s.imageUrl || s.image_url) as string | undefined;
          const meeting = (s.meetingUrl || s.meeting_url) as string | undefined;
          return (
            <article
              key={id}
              className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
            >
              <div className="aspect-[16/10] bg-[var(--color-border)]/40">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="p-5">
                <h2 className="text-lg font-bold text-[var(--color-foreground)]">{title}</h2>
                {id && meeting ? (
                  <Link
                    href={`/live/${encodeURIComponent(id)}`}
                    className="mt-4 inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    {t("live.join", "Watch on platform")}
                  </Link>
                ) : (
                  <span className="mt-4 inline-flex text-sm text-[var(--color-muted)]">
                    {t("live.details", "Details")}
                  </span>
                )}
              </div>
            </article>
          );
        })}
        {streams.length === 0 ? (
          <p className="text-[var(--color-muted)]">{t("live.empty", "No live streams right now.")}</p>
        ) : null}
      </div>
    </div>
  );
}
