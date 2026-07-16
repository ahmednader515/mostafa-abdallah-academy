import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeHeroHex } from "@/lib/hero-bg";
import {
  deleteCertificateById,
  getCertificateDesignSettings,
  listCertificatesForAdmin,
  updateCertificateDesignSettings,
  type CertificateDesignSettings,
} from "@/lib/lms-spec-db";

function trimOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function parseColor(v: unknown, fallback: string): string {
  const hex = normalizeHeroHex(String(v ?? ""));
  return hex ?? fallback;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const [design, certificates] = await Promise.all([
      getCertificateDesignSettings(),
      listCertificatesForAdmin(40),
    ]);
    return NextResponse.json({ design, certificates });
  } catch {
    return NextResponse.json({ error: "فشل جلب إعدادات الشهادات" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: Partial<CertificateDesignSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  try {
    const current = await getCertificateDesignSettings();
    const patch: Partial<CertificateDesignSettings> = {
      primaryColor: body.primaryColor !== undefined ? parseColor(body.primaryColor, current.primaryColor) : undefined,
      accentColor: body.accentColor !== undefined ? parseColor(body.accentColor, current.accentColor) : undefined,
      goldColor: body.goldColor !== undefined ? parseColor(body.goldColor, current.goldColor) : undefined,
      titleAr: body.titleAr !== undefined ? trimOrNull(body.titleAr) : undefined,
      titleEn: body.titleEn !== undefined ? trimOrNull(body.titleEn) : undefined,
      eyebrowAr: body.eyebrowAr !== undefined ? trimOrNull(body.eyebrowAr) : undefined,
      eyebrowEn: body.eyebrowEn !== undefined ? trimOrNull(body.eyebrowEn) : undefined,
      logoUrl: body.logoUrl !== undefined ? trimOrNull(body.logoUrl) : undefined,
      signatureUrl: body.signatureUrl !== undefined ? trimOrNull(body.signatureUrl) : undefined,
      signatureLabelAr: body.signatureLabelAr !== undefined ? trimOrNull(body.signatureLabelAr) : undefined,
      signatureLabelEn: body.signatureLabelEn !== undefined ? trimOrNull(body.signatureLabelEn) : undefined,
      showScore: body.showScore !== undefined ? Boolean(body.showScore) : undefined,
      showPattern: body.showPattern !== undefined ? Boolean(body.showPattern) : undefined,
      borderWidth:
        body.borderWidth !== undefined
          ? Math.min(16, Math.max(2, Math.round(Number(body.borderWidth) || 6)))
          : undefined,
    };

    const design = await updateCertificateDesignSettings(patch);
    return NextResponse.json({ success: true, design });
  } catch {
    return NextResponse.json({ error: "فشل حفظ إعدادات تصميم الشهادات" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "معرّف الشهادة مطلوب" }, { status: 400 });
  }

  try {
    const ok = await deleteCertificateById(id);
    if (!ok) return NextResponse.json({ error: "الشهادة غير موجودة" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حذف الشهادة" }, { status: 500 });
  }
}
