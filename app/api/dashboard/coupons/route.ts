import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createDiscountCouponsBatch,
  listDiscountCoupons,
  type CouponScope,
  type CouponTargetType,
} from "@/lib/lms-features-db";
import { permissionDeniedResponse } from "@/lib/require-permission";

const SCOPES: CouponScope[] = ["course", "library", "subscription", "store", "all"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const denied = await permissionDeniedResponse(
    session.user.id,
    session.user.role,
    "canManageCoupons",
  );
  if (denied) return denied;
  const coupons = await listDiscountCoupons();
  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const denied = await permissionDeniedResponse(
    session.user.id,
    session.user.role,
    "canManageCoupons",
  );
  if (denied) return denied;
  try {
    const body = await request.json();
    const scope = SCOPES.includes(body.scope) ? (body.scope as CouponScope) : "course";
    const targets = Array.isArray(body.targets)
      ? body.targets
          .filter((t: { targetType?: string; targetId?: string }) => t?.targetId && t?.targetType)
          .map((t: { targetType: string; targetId: string }) => ({
            targetType: t.targetType as CouponTargetType,
            targetId: String(t.targetId),
          }))
      : [];
    const batchCount = Math.min(Math.max(Number(body.batchCount) || 1, 1), 200);
    const created = await createDiscountCouponsBatch({
      code: body.code ? String(body.code) : undefined,
      discountType: body.discountType === "fixed" ? "fixed" : "percent",
      amount: Number(body.amount) || 0,
      scope,
      usageMode: body.usageMode === "fixed" ? "fixed" : "unlimited",
      maxUses: body.maxUses != null ? Number(body.maxUses) : null,
      maxUsesPerUser: body.maxUsesPerUser != null ? Number(body.maxUsesPerUser) : null,
      isActive: body.isActive !== false,
      campaignName: body.campaignName ?? null,
      startsAt: body.startsAt ?? null,
      expiresAt: body.expiresAt ?? null,
      targetMode: body.targetMode === "specific" ? "specific" : "all_in_scope",
      targets,
      batchCount,
    });
    return NextResponse.json({ success: true, coupons: created, count: created.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل إنشاء الكوبون" },
      { status: 500 },
    );
  }
}
