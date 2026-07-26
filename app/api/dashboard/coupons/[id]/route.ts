import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteDiscountCoupon, updateDiscountCoupon } from "@/lib/lms-features-db";

async function authorized() {
  const session = await getServerSession(authOptions);
  return session?.user.role === "ADMIN" || session?.user.role === "ASSISTANT_ADMIN";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  try {
    const [{ id }, body] = await Promise.all([params, request.json()]);
    await updateDiscountCoupon(id, {
      code: body.code,
      discountType: body.discountType,
      amount: body.amount === undefined ? undefined : Number(body.amount),
      scope: body.scope,
      usageMode: body.usageMode,
      maxUses: body.maxUses === undefined ? undefined : body.maxUses == null ? null : Number(body.maxUses),
      isActive: body.isActive,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل تحديث الكوبون" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  await deleteDiscountCoupon((await params).id);
  return NextResponse.json({ success: true });
}
