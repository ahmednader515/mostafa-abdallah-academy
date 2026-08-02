/**
 * تحويل روابط البث الخارجية إلى روابط مناسبة للـ iframe داخل المنصة.
 */

export type LiveEmbedResult = {
  /** رابط الـ iframe (إن أمكن) */
  embedUrl: string | null;
  /** الرابط الأصلي للفتح الخارجي عند الحاجة */
  originalUrl: string;
  /** هل يُتوقع أن يعمل داخل iframe (بعض المنصات تمنع التضمين) */
  likelyBlocked: boolean;
  providerLabel: string;
};

function safeUrl(raw: string): URL | null {
  try {
    return new URL(raw.trim());
  } catch {
    try {
      return new URL(`https://${raw.trim()}`);
    } catch {
      return null;
    }
  }
}

function youtubeIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed" || parts[0] === "live" || parts[0] === "shorts" || parts[0] === "v") {
      const id = parts[1];
      if (id && /^[\w-]{11}$/.test(id)) return id;
    }
  }
  return null;
}

function vimeoIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "video" && parts[1] && /^\d+$/.test(parts[1])) return parts[1];
  if (parts[0] && /^\d+$/.test(parts[0])) return parts[0];
  return null;
}

function twitchEmbed(url: URL, parentHost: string): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "twitch.tv" && host !== "m.twitch.tv" && host !== "player.twitch.tv") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "videos" && parts[1]) {
    return `https://player.twitch.tv/?video=${encodeURIComponent(parts[1])}&parent=${encodeURIComponent(parentHost)}&autoplay=false`;
  }
  if (parts[0] && parts[0] !== "directory") {
    return `https://player.twitch.tv/?channel=${encodeURIComponent(parts[0])}&parent=${encodeURIComponent(parentHost)}&autoplay=false`;
  }
  return null;
}

function facebookEmbed(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (
    host !== "facebook.com" &&
    host !== "m.facebook.com" &&
    host !== "fb.watch" &&
    host !== "web.facebook.com"
  ) {
    return null;
  }
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.toString())}&show_text=false&width=1280`;
}

function dailymotionEmbed(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "dailymotion.com" && host !== "dai.ly") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  let id = "";
  if (host === "dai.ly") id = parts[0] || "";
  else if (parts[0] === "video" && parts[1]) id = parts[1].split("_")[0] || "";
  if (!id) return null;
  return `https://www.dailymotion.com/embed/video/${id}`;
}

function isLikelyBlockedHost(host: string): boolean {
  const h = host.replace(/^www\./, "");
  return (
    h.includes("zoom.us") ||
    h.includes("zoom.com") ||
    h === "meet.google.com" ||
    h.endsWith(".zoom.us") ||
    h === "teams.microsoft.com" ||
    h.endsWith(".teams.microsoft.com")
  );
}

/**
 * @param rawUrl رابط الاجتماع / البث / التسجيل
 * @param parentHost نطاق المنصة (مطلوب لتويتش)، مثل localhost أو worldway.net
 */
export function resolveLiveEmbedUrl(
  rawUrl: string | null | undefined,
  parentHost = "localhost",
): LiveEmbedResult {
  const original = (rawUrl ?? "").trim();
  if (!original) {
    return { embedUrl: null, originalUrl: "", likelyBlocked: false, providerLabel: "" };
  }

  const url = safeUrl(original);
  if (!url) {
    return {
      embedUrl: null,
      originalUrl: original,
      likelyBlocked: false,
      providerLabel: "external",
    };
  }

  const host = url.hostname.replace(/^www\./, "");
  const yt = youtubeIdFromUrl(url);
  if (yt) {
    return {
      embedUrl: `https://www.youtube.com/embed/${yt}?autoplay=0&rel=0&modestbranding=1`,
      originalUrl: url.toString(),
      likelyBlocked: false,
      providerLabel: "YouTube",
    };
  }

  const vimeo = vimeoIdFromUrl(url);
  if (vimeo) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeo}`,
      originalUrl: url.toString(),
      likelyBlocked: false,
      providerLabel: "Vimeo",
    };
  }

  const twitch = twitchEmbed(url, parentHost || "localhost");
  if (twitch) {
    return {
      embedUrl: twitch,
      originalUrl: url.toString(),
      likelyBlocked: false,
      providerLabel: "Twitch",
    };
  }

  const fb = facebookEmbed(url);
  if (fb) {
    return {
      embedUrl: fb,
      originalUrl: url.toString(),
      likelyBlocked: false,
      providerLabel: "Facebook",
    };
  }

  const dm = dailymotionEmbed(url);
  if (dm) {
    return {
      embedUrl: dm,
      originalUrl: url.toString(),
      likelyBlocked: false,
      providerLabel: "Dailymotion",
    };
  }

  // روابط embed جاهزة أو أي موقع آخر — نستخدمها مباشرة داخل iframe
  const blocked = isLikelyBlockedHost(host);
  return {
    embedUrl: url.toString(),
    originalUrl: url.toString(),
    likelyBlocked: blocked,
    providerLabel: blocked
      ? host.includes("meet.google")
        ? "Google Meet"
        : host.includes("zoom")
          ? "Zoom"
          : host.includes("teams")
            ? "Microsoft Teams"
            : host
      : host,
  };
}
