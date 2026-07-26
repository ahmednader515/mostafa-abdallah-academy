import { NextRequest, NextResponse } from "next/server";
import { validateAndPreviewCoupon } from "@/lib/lms-features-db";

export async function POST(request: NextRequest) {
  try {
    const { code, scope, originalPrice } = await request.json();
    if (!["course", "library", "subscription"].includes(scope) || !String(code ?? "").trim() || !Number.isFinite(Number(originalPrice)) || Number(originalPrice) < 0) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }
    return NextResponse.json(await validateAndPreviewCoupon({ code: String(code), scope, originalPrice: Number(originalPrice) }));
  } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }
}
