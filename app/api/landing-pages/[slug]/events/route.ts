import { NextRequest, NextResponse } from "next/server";
import {
  recordLandingPageEventBySlug,
} from "@/lib/landing-pages-db";
import type { LandingPageEventType } from "@/lib/landing-page-types";

type Ctx = { params: Promise<{ slug: string }> };

const ALLOWED: LandingPageEventType[] = ["visit", "cta_click", "checkout_start", "purchase"];

export async function POST(request: NextRequest, ctx: Ctx) {
  const { slug: raw } = await ctx.params;
  let slug = raw;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }

  let body: { eventType?: string; meta?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const eventType = String(body.eventType || "") as LandingPageEventType;
  if (!ALLOWED.includes(eventType)) {
    return NextResponse.json({ error: "نوع حدث غير صالح" }, { status: 400 });
  }

  const result = await recordLandingPageEventBySlug(slug, eventType, body.meta);
  if (!result) return NextResponse.json({ error: "الصفحة غير موجودة" }, { status: 404 });
  return NextResponse.json({ ok: true, pageId: result.pageId });
}
