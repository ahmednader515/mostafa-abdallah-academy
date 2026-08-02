import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deleteCourseRating,
  listCourseRatingsForAdmin,
  setCourseRatingHidden,
} from "@/lib/db";

function canManage(role: string | undefined): boolean {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN";
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canManage(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const search = sp.get("search")?.trim() || "";
  const hiddenParam = sp.get("hidden");
  const hidden =
    hiddenParam === "true" ? true : hiddenParam === "false" ? false : null;
  const limit = Number(sp.get("limit") || 50);
  const offset = Number(sp.get("offset") || 0);

  try {
    const data = await listCourseRatingsForAdmin({ search, hidden, limit, offset });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "فشل جلب التقييمات" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canManage(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: { id?: string; isHidden?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id || typeof body.isHidden !== "boolean") {
    return NextResponse.json({ error: "معرّف التقييم وحالة الإخفاء مطلوبان" }, { status: 400 });
  }

  try {
    const ok = await setCourseRatingHidden(id, body.isHidden);
    if (!ok) return NextResponse.json({ error: "التقييم غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل تحديث التقييم" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "معرّف التقييم مطلوب" }, { status: 400 });
  }

  try {
    const ok = await deleteCourseRating(id);
    if (!ok) return NextResponse.json({ error: "التقييم غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حذف التقييم" }, { status: 500 });
  }
}
