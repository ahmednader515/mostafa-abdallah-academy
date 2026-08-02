import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateAndPreviewCoupon, type CouponScope } from "@/lib/lms-features-db";

const SCOPES: CouponScope[] = ["course", "library", "subscription", "store", "all"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scope = String(body.scope ?? "") as CouponScope;
    const code = String(body.code ?? "").trim();
    const originalPrice = Number(body.originalPrice);
    const targetId = body.targetId != null ? String(body.targetId) : null;
    if (!SCOPES.includes(scope) || !code || !Number.isFinite(originalPrice) || originalPrice < 0) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    const result = await validateAndPreviewCoupon({
      code,
      scope,
      originalPrice,
      targetId,
      userId: session?.user?.id ?? null,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
}
