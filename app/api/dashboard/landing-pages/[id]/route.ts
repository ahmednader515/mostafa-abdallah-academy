import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deleteLandingPage,
  getLandingPageById,
  getLandingPageStats,
  updateLandingPage,
} from "@/lib/landing-pages-db";
import type {
  LandingCtaTargetType,
  LandingSection,
  LandingTemplateId,
  LandingTheme,
} from "@/lib/landing-page-types";

function unauthorized() {
  return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
}

async function requireStaff() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return null;
  }
  return session;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  if (!(await requireStaff())) return unauthorized();
  const { id } = await ctx.params;
  const page = await getLandingPageById(id);
  if (!page) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const stats = await getLandingPageStats(id);
  return NextResponse.json({ page, stats });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!(await requireStaff())) return unauthorized();
  const { id } = await ctx.params;
  let body: Partial<{
    internalName: string;
    slug: string;
    templateId: LandingTemplateId;
    isPublished: boolean;
    isVisible: boolean;
    sortOrder: number;
    sections: LandingSection[];
    theme: LandingTheme;
    ctaTargetType: LandingCtaTargetType;
    ctaTargetId: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    ogImageUrl: string | null;
  }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const page = await updateLandingPage(id, body);
  if (!page) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({ page });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  if (!(await requireStaff())) return unauthorized();
  const { id } = await ctx.params;
  await deleteLandingPage(id);
  return NextResponse.json({ ok: true });
}
