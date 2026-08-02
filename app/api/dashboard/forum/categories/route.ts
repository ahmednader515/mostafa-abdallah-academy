import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  FORUM_AUDIENCES,
  createForumCategory,
  listForumCategories,
  type ForumAudience,
} from "@/lib/forum-db";

function canModerate(role: string | undefined): boolean {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN";
}

function parseAudience(raw: unknown, fallback: ForumAudience): ForumAudience {
  const v = String(raw ?? "").trim();
  return (FORUM_AUDIENCES as string[]).includes(v) ? (v as ForumAudience) : fallback;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canModerate(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const categories = await listForumCategories(false, { withThreadCount: true });
    return NextResponse.json({ categories });
  } catch (e) {
    console.error("GET /api/dashboard/forum/categories", e);
    return NextResponse.json({ error: "فشل جلب الأقسام" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canModerate(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 });

  try {
    const category = await createForumCategory({
      name,
      nameAr: body.nameAr != null ? String(body.nameAr) : null,
      description: body.description != null ? String(body.description) : null,
      descriptionAr: body.descriptionAr != null ? String(body.descriptionAr) : null,
      icon: body.icon != null ? String(body.icon) : "chat",
      color: body.color != null ? String(body.color) : "#0056D2",
      isVisible: body.isVisible !== false,
      isLocked: Boolean(body.isLocked),
      isPinned: Boolean(body.isPinned),
      isDefault: Boolean(body.isDefault),
      viewAudience: parseAudience(body.viewAudience, "public"),
      createAudience: parseAudience(body.createAudience, "logged_in"),
    });
    return NextResponse.json({ success: true, category });
  } catch (e) {
    console.error("POST /api/dashboard/forum/categories", e);
    return NextResponse.json({ error: "فشل إنشاء القسم" }, { status: 500 });
  }
}
