/** Client-side analytics helpers for GA4 / Facebook Pixel / GTM dataLayer + Meta CAPI. */

import type { MetaCustomData, MetaStandardEvent } from "@/lib/meta-capi";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function newAnalyticsEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function trackClientAnalytics(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  if (typeof window === "undefined") return;
  const safeParams = params ?? {};
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...safeParams });
  } catch {
    /* ignore */
  }
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, safeParams);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Dual-track a Meta standard event: Pixel (browser) + Conversions API (server).
 * Uses the same eventID so Meta deduplicates Pixel ↔ CAPI.
 * Automatic Pixel events stay disabled (autoConfig: false in layout).
 */
export function trackMetaEvent(
  eventName: MetaStandardEvent,
  customData?: MetaCustomData,
  opts?: {
    eventId?: string;
    userData?: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      externalId?: string;
    };
  },
): string {
  const eventId = opts?.eventId ?? newAnalyticsEventId();
  if (typeof window === "undefined") return eventId;

  const pixelParams: Record<string, unknown> = {};
  if (customData) {
    for (const [k, v] of Object.entries(customData)) {
      if (v !== undefined && v !== null) pixelParams[k] = v;
    }
  }

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, event_id: eventId, ...pixelParams });
  } catch {
    /* ignore */
  }

  try {
    if (typeof window.fbq === "function") {
      window.fbq("track", eventName, pixelParams, { eventID: eventId });
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, { ...pixelParams, event_id: eventId });
    }
  } catch {
    /* ignore */
  }

  void fetch("/api/meta/capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      customData,
      userData: opts?.userData,
    }),
    keepalive: true,
    credentials: "include",
  }).catch(() => undefined);

  return eventId;
}

export async function postLandingPageEvent(
  slug: string,
  eventType: "visit" | "cta_click" | "checkout_start" | "purchase",
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch(`/api/landing-pages/${encodeURIComponent(slug)}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, meta }),
      keepalive: true,
    });
  } catch {
    /* ignore network errors */
  }
  trackClientAnalytics(`landing_${eventType}`, {
    landing_slug: slug,
    ...(meta as Record<string, string | number | boolean | undefined>),
  });
}
