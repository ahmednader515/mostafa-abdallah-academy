import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createLandingPage,
  listLandingPagesAdmin,
} from "@/lib/landing-pages-db";
import type { LandingCtaTargetType, LandingTemplateId } from "@/lib/landing-page-types";

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

export async function GET() {
  if (!(await requireStaff())) return unauthorized();
  const pages = await listLandingPagesAdmin();
  return NextResponse.json({ pages });
}

export async function POST(request: NextRequest) {
  if (!(await requireStaff())) return unauthorized();
  let body: {
    internalName?: string;
    slug?: string;
    templateId?: LandingTemplateId;
    ctaTargetType?: LandingCtaTargetType;
    ctaTargetId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const page = await createLandingPage({
    internalName: String(body.internalName || "صفحة هبوط جديدة"),
    slug: body.slug,
    templateId: body.templateId,
    ctaTargetType: body.ctaTargetType,
    ctaTargetId: body.ctaTargetId ?? null,
  });
  return NextResponse.json({ page });
}
