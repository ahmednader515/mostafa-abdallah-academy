import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getHomepageLiveStreams } from "@/lib/lms-spec-db";
import { getStudentDashboardFlags } from "@/lib/student-dashboard";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export default async function StudentLivePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  const flags = await getStudentDashboardFlags();
  if (!flags.live) redirect("/dashboard");

  const [t, locale, streams] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getHomepageLiveStreams().catch(() => []),
  ]);

  const now = Date.now();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("studentDash.nav.live", "Live")}</h2>
        <Link href="/live" className="text-sm underline">
          {t("studentDash.allLive", "All live streams")}
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {streams.map((raw) => {
          const s = raw as Record<string, unknown>;
          const title =
            pickLocalizedText(
              locale,
              (s.titleAr as string) || (s.title_ar as string) || null,
              (s.title as string) || null,
            ) || "Live";
          const meeting = (s.meetingUrl || s.meeting_url) as string | undefined;
          const scheduled = s.scheduledAt || s.scheduled_at;
          const at = scheduled ? new Date(String(scheduled)).getTime() : null;
          const status =
            at == null
              ? t("studentDash.liveFeatured", "Featured")
              : at > now
                ? t("studentDash.liveUpcoming", "Upcoming")
                : t("studentDash.liveNowOrPast", "Live / past");
          return (
            <article key={String(s.id)} className="rounded-2xl border border-[var(--color-border)] p-4">
              <p className="text-xs text-[var(--color-muted)]">{status}</p>
              <h3 className="mt-1 font-semibold">{title}</h3>
              {meeting ? (
                <a
                  href={meeting}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("studentDash.joinLive", "Join stream")}
                </a>
              ) : null}
            </article>
          );
        })}
      </div>
      {streams.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">{t("studentDash.noLive", "No live streams.")}</p>
      ) : null}
    </div>
  );
}
