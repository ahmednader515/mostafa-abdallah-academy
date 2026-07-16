export type HomeLiveStream = {
  id: string;
  title: string;
  titleAr?: string | null;
  provider: string;
  meetingUrl?: string | null;
  recordingUrl?: string | null;
  scheduledAt: string | Date;
  description?: string | null;
  courseId?: string | null;
};

const PROVIDER_LABEL_AR: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  youtube_live: "يوتيوب لايف",
  external: "منصة خارجية",
};

/** قسم الصفحة الرئيسية «البث المباشر» — يعرض البثوث المُفعَّل ظهورها على الرئيسية */
export function HomeLiveStreamsSection({
  streams,
  titleAr,
  titleEn,
  locale = "ar",
}: {
  streams: HomeLiveStream[];
  titleAr?: string;
  titleEn?: string;
  locale?: "ar" | "en";
}) {
  if (!streams || streams.length === 0) return null;

  const heading = locale === "en" ? titleEn || "Live streams" : titleAr || "البث المباشر";

  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-[var(--color-foreground)]">{heading}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {streams.map((s) => {
            const scheduledAt = typeof s.scheduledAt === "string" ? new Date(s.scheduledAt) : s.scheduledAt;
            // eslint-disable-next-line react-hooks/purity -- server component: snapshot time at request render
            const isPast = scheduledAt.getTime() < Date.now();
            const link = isPast ? s.recordingUrl?.trim() || s.meetingUrl?.trim() : s.meetingUrl?.trim();
            return (
              <div
                key={s.id}
                className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-card)]"
              >
                <span className="inline-flex rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {PROVIDER_LABEL_AR[s.provider] ?? s.provider}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-[var(--color-foreground)]">
                  {s.titleAr || s.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {scheduledAt.toLocaleString(locale === "en" ? "en-US" : "ar-EG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
                  >
                    {isPast ? (locale === "en" ? "Watch recording" : "مشاهدة التسجيل") : locale === "en" ? "Join now" : "الانضمام الآن"}
                  </a>
                ) : (
                  <span className="mt-4 inline-flex text-sm text-[var(--color-muted)]">
                    {locale === "en" ? "Link coming soon" : "الرابط قريباً"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
