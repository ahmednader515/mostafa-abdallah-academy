import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDiscountCoupon, listDiscountCoupons } from "@/lib/lms-features-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const coupons = await listDiscountCoupons();
  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const result = await createDiscountCoupon({
      code: String(body.code || ""),
      discountType: body.discountType === "fixed" ? "fixed" : "percent",
      amount: Number(body.amount) || 0,
      scope: body.scope === "library" || body.scope === "subscription" ? body.scope : "course",
      usageMode: body.usageMode === "fixed" ? "fixed" : "unlimited",
      maxUses: body.maxUses != null ? Number(body.maxUses) : null,
      isActive: body.isActive !== false,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل إنشاء الكوبون" },
      { status: 500 },
    );
  }
}
