import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeHeroHex } from "@/lib/hero-bg";
import {
  deleteCertificateTemplate,
  getCertificateTemplate,
  parseSignaturesJson,
  updateCertificateTemplate,
  type CertificateTemplate,
} from "@/lib/certificate-templates-db";

type Params = { params: Promise<{ id: string }> };

function trimOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function parseColor(v: unknown, fallback: string): string {
  return normalizeHeroHex(String(v ?? "")) ?? fallback;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const template = await getCertificateTemplate(id);
  if (!template) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json({ template });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  const current = await getCertificateTemplate(id);
  if (!current) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  let body: Partial<CertificateTemplate>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  try {
    const patch: Partial<CertificateTemplate> = {};
    if (body.name !== undefined) patch.name = String(body.name).trim() || current.name;
    if (body.nameAr !== undefined) patch.nameAr = trimOrNull(body.nameAr);
    if (body.isDefault !== undefined) patch.isDefault = Boolean(body.isDefault);
    if (body.orientation !== undefined)
      patch.orientation = body.orientation === "landscape" ? "landscape" : "portrait";
    if (body.primaryColor !== undefined) patch.primaryColor = parseColor(body.primaryColor, current.primaryColor);
    if (body.accentColor !== undefined) patch.accentColor = parseColor(body.accentColor, current.accentColor);
    if (body.goldColor !== undefined) patch.goldColor = parseColor(body.goldColor, current.goldColor);
    if (body.bgColor !== undefined) patch.bgColor = parseColor(body.bgColor, current.bgColor);
    if (body.titleAr !== undefined) patch.titleAr = trimOrNull(body.titleAr);
    if (body.titleEn !== undefined) patch.titleEn = trimOrNull(body.titleEn);
    if (body.eyebrowAr !== undefined) patch.eyebrowAr = trimOrNull(body.eyebrowAr);
    if (body.eyebrowEn !== undefined) patch.eyebrowEn = trimOrNull(body.eyebrowEn);
    if (body.bodyAr !== undefined) patch.bodyAr = trimOrNull(body.bodyAr);
    if (body.bodyEn !== undefined) patch.bodyEn = trimOrNull(body.bodyEn);
    if (body.logoUrl !== undefined) patch.logoUrl = trimOrNull(body.logoUrl);
    if (body.logoWidthPct !== undefined) patch.logoWidthPct = Number(body.logoWidthPct);
    if (body.logoYPct !== undefined) patch.logoYPct = Number(body.logoYPct);
    if (body.sealUrl !== undefined) patch.sealUrl = trimOrNull(body.sealUrl);
    if (body.sealWidthPct !== undefined) patch.sealWidthPct = Number(body.sealWidthPct);
    if (body.sealXPct !== undefined) patch.sealXPct = Number(body.sealXPct);
    if (body.sealYPct !== undefined) patch.sealYPct = Number(body.sealYPct);
    if (body.borderWidth !== undefined) patch.borderWidth = Number(body.borderWidth);
    if (body.frameStyle !== undefined) patch.frameStyle = body.frameStyle;
    if (body.fontFamily !== undefined) patch.fontFamily = body.fontFamily;
    if (body.showScore !== undefined) patch.showScore = Boolean(body.showScore);
    if (body.showPattern !== undefined) patch.showPattern = Boolean(body.showPattern);
    if (body.showQr !== undefined) patch.showQr = Boolean(body.showQr);
    if (body.showSeal !== undefined) patch.showSeal = Boolean(body.showSeal);
    if (body.signatures !== undefined) patch.signatures = parseSignaturesJson(body.signatures);

    const template = await updateCertificateTemplate(id, patch);
    return NextResponse.json({ success: true, template });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل التحديث";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const ok = await deleteCertificateTemplate(id);
    if (!ok) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل الحذف";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
