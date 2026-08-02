/**
 * Canonical public site origin for sitemap, robots, Open Graph, and absolute URLs.
 * Prefer SITE_URL / NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_PRIMARY_DOMAIN.
 * Invalid or incomplete hosts (e.g. "mostafa-abdullah-academy" without a TLD) are ignored.
 */
export const DEFAULT_PRODUCTION_SITE_ORIGIN = "https://www.worldway.net";

function looksLikePublicHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (!host) return false;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  // Require a real domain (has a dot). Reject bare labels like "mostafa-abdullah-academy".
  if (!host.includes(".")) return false;
  // Reject accidental use of the R2 bucket / project nickname as a domain.
  if (host === "mostafa-abdullah-academy") return false;
  return true;
}

/** Normalize a candidate env value to `https://host` (no trailing slash), or null if invalid. */
export function normalizeSiteOrigin(raw: string | undefined | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  let candidate = trimmed.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!looksLikePublicHostname(url.hostname)) return null;
    // Force https in production-like hosts (not localhost).
    const protocol =
      url.hostname === "localhost" || url.hostname.endsWith(".localhost")
        ? url.protocol
        : "https:";
    return `${protocol}//${url.host}`.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development")
  );
}

/**
 * Resolves the canonical site origin.
 * Order: SITE_URL → NEXT_PUBLIC_SITE_URL → NEXT_PUBLIC_PRIMARY_DOMAIN → NEXTAUTH_URL →
 * production default (www.worldway.net) / localhost in development.
 */
export function getSiteOrigin(): string {
  const candidates = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_PRIMARY_DOMAIN,
    process.env.NEXTAUTH_URL,
  ];

  for (const value of candidates) {
    const origin = normalizeSiteOrigin(value);
    if (origin) return origin;
  }

  if (isProductionRuntime()) {
    return DEFAULT_PRODUCTION_SITE_ORIGIN;
  }

  return "http://localhost:3000";
}
