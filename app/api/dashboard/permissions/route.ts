import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deletePermissionOverride,
  getUserPermissionState,
  listPermissionOverrides,
  upsertPermissionOverride,
  type PermissionFlags,
} from "@/lib/lms-features-db";
import { getUserById } from "@/lib/db";
import { recordAdminAudit } from "@/lib/admin-security-db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("userId")?.trim();
  if (userId) {
    const roleParam = request.nextUrl.searchParams.get("role")?.trim();
    let role = roleParam || "";
    if (!role) {
      const user = await getUserById(userId);
      if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
      role = String(user.role);
    }
    const state = await getUserPermissionState(userId, role);
    return NextResponse.json(state);
  }

  const overrides = await listPermissionOverrides();
  return NextResponse.json({ overrides });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: {
    userId?: string | null;
    role?: string | null;
  } & Partial<PermissionFlags>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  // عند التخصيص على مستوى المستخدم: تأكد أن الحساب موجود (أي دور)
  const userId = body.userId?.trim() || null;
  if (userId) {
    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  const allowedRoles = ["STUDENT", "TEACHER", "ASSISTANT_ADMIN", "ADMIN"];
  if (body.role && !allowedRoles.includes(String(body.role))) {
    return NextResponse.json({ error: "دور غير صالح" }, { status: 400 });
  }

  try {
    const row = await upsertPermissionOverride({
      ...body,
      userId,
      role: userId ? null : body.role,
    });
    await recordAdminAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "upsert_permission",
      targetType: userId ? "user" : "role",
      targetId: userId || body.role || null,
      details: JSON.stringify(body),
    }).catch(() => undefined);
    return NextResponse.json({ success: true, override: row });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل الحفظ" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id مطلوب" }, { status: 400 });
  await deletePermissionOverride(id);
  await recordAdminAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "delete_permission",
    targetType: "permission",
    targetId: id,
  }).catch(() => undefined);
  return NextResponse.json({ success: true });
}
