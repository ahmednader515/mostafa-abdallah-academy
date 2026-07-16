import { NextRequest, NextResponse } from "next/server";
import { getCertificateByPublicId } from "@/lib/lms-spec-db";

/** التحقق العلني من صحة شهادة عبر رقمها العام (بدون حاجة لتسجيل الدخول) */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  try {
    const certificate = await getCertificateByPublicId(certificateId);
    if (!certificate) {
      return NextResponse.json({ valid: false, error: "الشهادة غير موجودة" }, { status: 404 });
    }
    return NextResponse.json({ valid: true, certificate });
  } catch {
    return NextResponse.json({ valid: false, error: "فشل التحقق من الشهادة" }, { status: 500 });
  }
}
