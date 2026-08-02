import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { LiveStreamEmbed } from "@/components/LiveStreamEmbed";
import { getLiveStreamById } from "@/lib/db";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { resolveLiveEmbedUrl } from "@/lib/live-embed";

export const dynamic = "force-dynamic";

export default async function LiveStreamWatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, locale, stream, headerList] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getLiveStreamById(id).catch(() => null),
    headers(),
  ]);

  if (!stream) notFound();

  const title =
    pickLocalizedText(
      locale,
      (stream as { titleAr?: string | null; title_ar?: string | null }).titleAr ??
        stream.title_ar,
      stream.title,
    ) || stream.title;

  const scheduled =
    (stream as { scheduledAt?: Date | string }).scheduledAt ?? stream.scheduled_at;
  const scheduledAt = scheduled ? new Date(scheduled) : null;
  const isPast = scheduledAt ? scheduledAt.getTime() < Date.now() : false;

  const meetingUrl =
    (stream as { meetingUrl?: string | null }).meetingUrl ?? stream.meeting_url ?? "";
  const recordingUrl =
    (stream as { recordingUrl?: string | null; recording_url?: string | null }).recordingUrl ??
    (stream as { recording_url?: string | null }).recording_url ??
    null;

  const watchUrl = (isPast ? recordingUrl?.trim() || meetingUrl : meetingUrl)?.trim() || "";
  const host =
    headerList.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    headerList.get("host") ||
    "localhost";

  const embed = resolveLiveEmbedUrl(watchUrl, host.replace(/:\d+$/, ""));

  const description = stream.description?.trim() || "";
  const password =
    (stream as { meetingPassword?: string | null }).meetingPassword ??
    stream.meeting_password;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Link
        href="/live"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        {t("live.backToList", "← Back to live streams")}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-foreground)] sm:text-3xl">
            {title}
          </h1>
          {scheduledAt ? (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {scheduledAt.toLocaleString(locale === "en" ? "en-US" : "ar-EG", {
                dateStyle: "full",
                timeStyle: "short",
              })}
              {isPast ? ` · ${t("live.recording", "Recording")}` : ` · ${t("live.liveNow", "Live")}`}
            </p>
          ) : null}
          {embed.providerLabel ? (
            <p className="mt-2 inline-flex rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              {embed.providerLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        {watchUrl ? (
          <LiveStreamEmbed
            title={title}
            embedUrl={embed.embedUrl}
            originalUrl={embed.originalUrl || watchUrl}
            likelyBlocked={embed.likelyBlocked}
          />
        ) : (
          <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
            {t("live.noLink", "No stream link is available yet.")}
          </p>
        )}
      </div>

      {password ? (
        <p className="mt-4 text-sm text-[var(--color-muted)]">
          {t("live.password", "Meeting password")}:{" "}
          <span className="font-semibold text-[var(--color-foreground)]" dir="ltr">
            {password}
          </span>
        </p>
      ) : null}

      {description ? (
        <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap text-[var(--color-foreground)] dark:prose-invert">
          {description}
        </div>
      ) : null}
    </div>
  );
}
