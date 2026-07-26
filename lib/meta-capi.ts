import { createHash } from "crypto";
import { getBrandAndAnalyticsSettings, getMetaCapiAccessTokenFromDb } from "@/lib/lms-spec-db";

export const META_STANDARD_EVENTS = [
  "PageView",
  "ViewContent",
  "CompleteRegistration",
  "Search",
  "InitiateCheckout",
  "Purchase",
] as const;

export type MetaStandardEvent = (typeof META_STANDARD_EVENTS)[number];

export type MetaUserDataInput = {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  externalId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
};

export type MetaCustomData = {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: Array<{ id: string; quantity?: number; item_price?: number }>;
  num_items?: number;
  search_string?: string;
  order_id?: string;
  status?: string;
};

export type MetaCapiEventInput = {
  eventName: MetaStandardEvent | string;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string | null;
  actionSource?: "website" | "email" | "app" | "phone_call" | "chat" | "physical_store" | "system_generated" | "other";
  userData?: MetaUserDataInput;
  customData?: MetaCustomData;
};

function normalizeForHash(value: string): string {
  return value.trim().toLowerCase();
}

function sha256(value: string): string {
  return createHash("sha256").update(normalizeForHash(value)).digest("hex");
}

function hashIfPresent(value: string | null | undefined): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  return sha256(v);
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

export function buildMetaUserData(input: MetaUserDataInput = {}): Record<string, string> {
  const out: Record<string, string> = {};
  const em = hashIfPresent(input.email);
  if (em) out.em = em;
  if (input.phone?.trim()) {
    out.ph = sha256(normalizePhone(input.phone));
  }
  const fn = hashIfPresent(input.firstName);
  if (fn) out.fn = fn;
  const ln = hashIfPresent(input.lastName);
  if (ln) out.ln = ln;
  const ext = hashIfPresent(input.externalId);
  if (ext) out.external_id = ext;
  if (input.fbp?.trim()) out.fbp = input.fbp.trim();
  if (input.fbc?.trim()) out.fbc = input.fbc.trim();
  if (input.clientIpAddress?.trim()) out.client_ip_address = input.clientIpAddress.trim();
  if (input.clientUserAgent?.trim()) out.client_user_agent = input.clientUserAgent.trim();
  return out;
}

export async function getMetaPixelId(): Promise<string | null> {
  const fromEnv = process.env.META_PIXEL_ID?.trim() || process.env.FACEBOOK_PIXEL_ID?.trim();
  if (fromEnv) return fromEnv;
  try {
    const brand = await getBrandAndAnalyticsSettings();
    return brand.facebookPixelId?.trim() || null;
  } catch {
    return null;
  }
}

export async function getMetaCapiAccessToken(): Promise<string | null> {
  const fromEnv = process.env.META_CAPI_ACCESS_TOKEN?.trim() || process.env.FACEBOOK_CAPI_ACCESS_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  try {
    return (await getMetaCapiAccessTokenFromDb())?.trim() || null;
  } catch {
    return null;
  }
}

export function getMetaTestEventCode(): string | null {
  return process.env.META_CAPI_TEST_EVENT_CODE?.trim() || null;
}

/** Send one or more events to Meta Conversions API. No-ops if pixel/token missing. */
export async function sendMetaCapiEvents(events: MetaCapiEventInput[]): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!events.length) return { ok: true, skipped: true };

  const [pixelId, accessToken] = await Promise.all([getMetaPixelId(), getMetaCapiAccessToken()]);
  if (!pixelId || !accessToken) {
    return { ok: true, skipped: true };
  }

  const data = events.map((evt) => {
    const payload: Record<string, unknown> = {
      event_name: evt.eventName,
      event_time: evt.eventTime ?? Math.floor(Date.now() / 1000),
      event_id: evt.eventId,
      action_source: evt.actionSource ?? "website",
      user_data: buildMetaUserData(evt.userData ?? {}),
    };
    if (evt.eventSourceUrl) payload.event_source_url = evt.eventSourceUrl;
    if (evt.customData && Object.keys(evt.customData).length > 0) {
      payload.custom_data = evt.customData;
    }
    return payload;
  });

  const body: Record<string, unknown> = { data };
  const testCode = getMetaTestEventCode();
  if (testCode) body.test_event_code = testCode;

  try {
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Meta CAPI error:", res.status, text.slice(0, 500));
      return { ok: false, error: `Meta CAPI ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("Meta CAPI request failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Meta CAPI failed" };
  }
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || headers.get("cf-connecting-ip")?.trim() || null;
}

export function metaCookiesFromHeader(cookieHeader: string | null): { fbp: string | null; fbc: string | null } {
  if (!cookieHeader) return { fbp: null, fbc: null };
  const parts = cookieHeader.split(";").map((p) => p.trim());
  let fbp: string | null = null;
  let fbc: string | null = null;
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key === "_fbp") fbp = val;
    if (key === "_fbc") fbc = val;
  }
  return { fbp, fbc };
}

export function newMetaEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `meta_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}
