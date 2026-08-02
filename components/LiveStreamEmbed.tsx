"use client";

import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export function LiveStreamEmbed({
  embedUrl,
  originalUrl,
  likelyBlocked,
  title,
}: {
  embedUrl: string | null;
  originalUrl: string;
  likelyBlocked: boolean;
  title: string;
}) {
  const t = useT();
  const [failed, setFailed] = useState(false);
  const showIframe = Boolean(embedUrl) && !failed;

  return (
    <div className="space-y-4">
      {likelyBlocked || failed ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t(
            "live.embedMayBlock",
            "This platform may block embedding. Watch inside the player below, or open the original link if it does not load.",
          )}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black shadow-[var(--shadow-card)]">
        <div className="relative aspect-video w-full">
          {showIframe && embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b1220] px-6 text-center text-white">
              <p className="text-sm text-white/80">
                {t("live.embedUnavailable", "Could not embed this link inside the platform.")}
              </p>
              {originalUrl ? (
                <a
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("live.openExternal", "Open original link")}
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {originalUrl ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            {t("live.openExternal", "Open original link")}
          </a>
          {showIframe ? (
            <button
              type="button"
              onClick={() => setFailed(true)}
              className="text-sm text-[var(--color-muted)] hover:underline"
            >
              {t("live.playerNotWorking", "Player not working?")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
