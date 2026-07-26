import { NextRequest, NextResponse } from "next/server";
import { getBrandAndAnalyticsSettings } from "@/lib/lms-spec-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolveTargetUrl(raw: string, request: NextRequest): URL | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
      return new URL(value);
    }
    if (value.startsWith("//")) {
      return new URL(`${request.nextUrl.protocol}${value}`);
    }
    if (value.startsWith("/")) {
      return new URL(value, request.nextUrl.origin);
    }
    return new URL(`/${value}`, request.nextUrl.origin);
  } catch {
    return null;
  }
}

function guessContentType(url: URL, upstream: string | null): string {
  if (upstream && upstream !== "application/octet-stream") return upstream;
  const path = url.pathname.toLowerCase();
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".ico")) return "image/x-icon";
  return "image/png";
}

/** Serves the admin-configured favicon, or the built-in default. */
export async function GET(request: NextRequest) {
  const variant = request.nextUrl.searchParams.get("variant");
  const defaultPath =
    variant === "apple"
      ? "/default-favicon/apple-touch-icon.png"
      : "/default-favicon/favicon.ico";

  let target =
    resolveTargetUrl(defaultPath, request) ??
    new URL("/default-favicon/favicon.svg", request.nextUrl.origin);

  try {
    const brand = await getBrandAndAnalyticsSettings();
    const custom = brand.faviconUrl ? resolveTargetUrl(brand.faviconUrl, request) : null;
    if (custom) target = custom;
  } catch {
    /* use default */
  }

  // data: URLs cannot be fetched; redirect the browser.
  if (target.protocol === "data:") {
    const res = NextResponse.redirect(target, 302);
    res.headers.set("Cache-Control", "public, max-age=60, must-revalidate");
    return res;
  }

  // Always proxy image bytes (same-origin or R2) so /favicon.ico is a real image response.
  // Browsers often ignore or cache poorly when favicon endpoints only 302.
  try {
    const upstream = await fetch(target.toString(), {
      cache: "no-store",
      headers: { Accept: "image/*,*/*" },
      redirect: "follow",
    });
    if (upstream.ok) {
      const buf = await upstream.arrayBuffer();
      const contentType = guessContentType(target, upstream.headers.get("content-type"));
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=60, must-revalidate",
        },
      });
    }
  } catch {
    /* fall through to default */
  }

  // Fallback to packaged default if custom URL fails.
  if (target.pathname !== defaultPath) {
    const fallback = resolveTargetUrl(defaultPath, request);
    if (fallback) {
      try {
        const upstream = await fetch(fallback, { cache: "no-store" });
        if (upstream.ok) {
          const buf = await upstream.arrayBuffer();
          return new NextResponse(buf, {
            status: 200,
            headers: {
              "Content-Type": guessContentType(fallback, upstream.headers.get("content-type")),
              "Cache-Control": "public, max-age=60, must-revalidate",
            },
          });
        }
      } catch {
        /* ignore */
      }
    }
  }

  return new NextResponse("Favicon unavailable", { status: 404 });
}
