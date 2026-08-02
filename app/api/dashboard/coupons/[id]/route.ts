import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deleteDiscountCoupon,
  updateDiscountCoupon,
  type CouponScope,
  type CouponTargetType,
} from "@/lib/lms-features-db";
import { permissionDeniedResponse } from "@/lib/require-permission";

const SCOPES: CouponScope[] = ["course", "library", "subscription", "store", "all"];

async function authorizeCoupons() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  return permissionDeniedResponse(session.user.id, session.user.role, "canManageCoupons");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeCoupons();
  if (denied) return denied;
  try {
    const [{ id }, body] = await Promise.all([params, request.json()]);
    const patch: Parameters<typeof updateDiscountCoupon>[1] = {};
    if (body.code !== undefined) patch.code = String(body.code);
    if (body.discountType !== undefined) patch.discountType = body.discountType === "fixed" ? "fixed" : "percent";
    if (body.amount !== undefined) patch.amount = Number(body.amount);
    if (body.scope !== undefined && SCOPES.includes(body.scope)) patch.scope = body.scope;
    if (body.usageMode !== undefined) patch.usageMode = body.usageMode === "fixed" ? "fixed" : "unlimited";
    if (body.maxUses !== undefined) patch.maxUses = body.maxUses == null ? null : Number(body.maxUses);
    if (body.maxUsesPerUser !== undefined)
      patch.maxUsesPerUser = body.maxUsesPerUser == null ? null : Number(body.maxUsesPerUser);
    if (body.isActive !== undefined) patch.isActive = !!body.isActive;
    if (body.campaignName !== undefined) patch.campaignName = body.campaignName;
    if (body.startsAt !== undefined) patch.startsAt = body.startsAt;
    if (body.expiresAt !== undefined) patch.expiresAt = body.expiresAt;
    if (body.targetMode !== undefined)
      patch.targetMode = body.targetMode === "specific" ? "specific" : "all_in_scope";
    if (Array.isArray(body.targets)) {
      patch.targets = body.targets
        .filter((t: { targetType?: string; targetId?: string }) => t?.targetId && t?.targetType)
        .map((t: { targetType: string; targetId: string }) => ({
          targetType: t.targetType as CouponTargetType,
          targetId: String(t.targetId),
        }));
    }
    await updateDiscountCoupon(id, patch);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل تحديث الكوبون" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorizeCoupons();
  if (denied) return denied;
  await deleteDiscountCoupon((await params).id);
  return NextResponse.json({ success: true });
}
