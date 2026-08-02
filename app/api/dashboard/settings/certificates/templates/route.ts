import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeHeroHex } from "@/lib/hero-bg";
import {
  createCertificateTemplate,
  listCertificateTemplates,
  parseSignaturesJson,
  type CertificateTemplate,
} from "@/lib/certificate-templates-db";

function trimOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function parseColor(v: unknown, fallback: string): string {
  return normalizeHeroHex(String(v ?? "")) ?? fallback;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const templates = await listCertificateTemplates();
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ error: "فشل جلب القوالب" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: Partial<CertificateTemplate>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  try {
    const template = await createCertificateTemplate({
      name: String(body.name ?? "Template").trim() || "Template",
      nameAr: trimOrNull(body.nameAr),
      isDefault: Boolean(body.isDefault),
      orientation: body.orientation === "landscape" ? "landscape" : "portrait",
      primaryColor: parseColor(body.primaryColor, "#0F172A"),
      accentColor: parseColor(body.accentColor, "#2563EB"),
      goldColor: parseColor(body.goldColor, "#F59E0B"),
      bgColor: parseColor(body.bgColor, "#FFFFFF"),
      titleAr: trimOrNull(body.titleAr),
      titleEn: trimOrNull(body.titleEn),
      eyebrowAr: trimOrNull(body.eyebrowAr),
      eyebrowEn: trimOrNull(body.eyebrowEn),
      bodyAr: trimOrNull(body.bodyAr),
      bodyEn: trimOrNull(body.bodyEn),
      logoUrl: trimOrNull(body.logoUrl),
      logoWidthPct: body.logoWidthPct != null ? Number(body.logoWidthPct) : undefined,
      logoYPct: body.logoYPct != null ? Number(body.logoYPct) : undefined,
      sealUrl: trimOrNull(body.sealUrl),
      sealWidthPct: body.sealWidthPct != null ? Number(body.sealWidthPct) : undefined,
      sealXPct: body.sealXPct != null ? Number(body.sealXPct) : undefined,
      sealYPct: body.sealYPct != null ? Number(body.sealYPct) : undefined,
      borderWidth: body.borderWidth != null ? Number(body.borderWidth) : undefined,
      frameStyle: body.frameStyle,
      fontFamily: body.fontFamily,
      showScore: body.showScore !== undefined ? Boolean(body.showScore) : true,
      showPattern: body.showPattern !== undefined ? Boolean(body.showPattern) : true,
      showQr: body.showQr !== undefined ? Boolean(body.showQr) : true,
      showSeal: body.showSeal !== undefined ? Boolean(body.showSeal) : false,
      signatures: body.signatures ? parseSignaturesJson(body.signatures) : undefined,
    });
    return NextResponse.json({ success: true, template });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل إنشاء القالب";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
