import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deletePermissionOverride,
  listPermissionOverrides,
  upsertPermissionOverride,
  type PermissionFlags,
} from "@/lib/lms-features-db";
import { recordAdminAudit } from "@/lib/admin-security-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
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
  try {
    const row = await upsertPermissionOverride(body);
    await recordAdminAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "upsert_permission",
      targetType: body.userId ? "user" : "role",
      targetId: body.userId || body.role || null,
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
