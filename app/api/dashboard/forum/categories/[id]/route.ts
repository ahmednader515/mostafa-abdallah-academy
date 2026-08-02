import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  FORUM_AUDIENCES,
  deleteForumCategory,
  getForumCategoryById,
  updateForumCategory,
  type ForumAudience,
} from "@/lib/forum-db";

function canModerate(role: string | undefined): boolean {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN";
}

function parseAudience(raw: unknown): ForumAudience | undefined {
  if (raw === undefined || raw === null) return undefined;
  const v = String(raw).trim();
  return (FORUM_AUDIENCES as string[]).includes(v) ? (v as ForumAudience) : undefined;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canModerate(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const patch: Parameters<typeof updateForumCategory>[1] = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 });
    patch.name = name;
  }
  if (body.nameAr !== undefined) patch.nameAr = body.nameAr == null ? null : String(body.nameAr);
  if (body.description !== undefined)
    patch.description = body.description == null ? null : String(body.description);
  if (body.descriptionAr !== undefined)
    patch.descriptionAr = body.descriptionAr == null ? null : String(body.descriptionAr);
  if (body.icon !== undefined) patch.icon = String(body.icon);
  if (body.color !== undefined) patch.color = String(body.color);
  if (body.isVisible !== undefined) patch.isVisible = Boolean(body.isVisible);
  if (body.isLocked !== undefined) patch.isLocked = Boolean(body.isLocked);
  if (body.isPinned !== undefined) patch.isPinned = Boolean(body.isPinned);
  if (body.isDefault !== undefined) patch.isDefault = Boolean(body.isDefault);
  const viewAudience = parseAudience(body.viewAudience);
  if (viewAudience) patch.viewAudience = viewAudience;
  const createAudience = parseAudience(body.createAudience);
  if (createAudience) patch.createAudience = createAudience;

  try {
    const category = await updateForumCategory(id, patch);
    if (!category) return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true, category });
  } catch (e) {
    console.error("PATCH /api/dashboard/forum/categories/[id]", e);
    return NextResponse.json({ error: "فشل تحديث القسم" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canModerate(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  let body: { mode?: string; moveToCategoryId?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const existing = await getForumCategoryById(id);
  if (!existing) return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });

  const mode = body.mode === "move" ? "move" : "block";
  try {
    const result = await deleteForumCategory(id, {
      mode,
      moveToCategoryId: body.moveToCategoryId ?? null,
    });
    if (!result.deleted) {
      if (result.reason === "has_threads") {
        return NextResponse.json(
          {
            error: "لا يمكن حذف قسم يحتوي على مواضيع. انقل المواضيع أولاً أو اختر وضع النقل.",
            reason: result.reason,
            threadCount: existing.threadCount ?? 0,
          },
          { status: 409 },
        );
      }
      if (result.reason === "move_target_required") {
        return NextResponse.json({ error: "اختر قسماً لنقل المواضيع إليه", reason: result.reason }, { status: 400 });
      }
      return NextResponse.json({ error: "تعذّر الحذف", reason: result.reason }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/dashboard/forum/categories/[id]", e);
    return NextResponse.json({ error: "فشل حذف القسم" }, { status: 500 });
  }
}
