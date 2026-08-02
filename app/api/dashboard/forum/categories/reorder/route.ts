import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { reorderForumCategories } from "@/lib/forum-db";

function canModerate(role: string | undefined): boolean {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN";
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canModerate(session.user.role)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: { orderedIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const orderedIds = Array.isArray(body.orderedIds)
    ? body.orderedIds.map((id) => String(id)).filter(Boolean)
    : [];
  if (orderedIds.length === 0) {
    return NextResponse.json({ error: "قائمة الترتيب فارغة" }, { status: 400 });
  }
  try {
    await reorderForumCategories(orderedIds);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/dashboard/forum/categories/reorder", e);
    return NextResponse.json({ error: "فشل إعادة الترتيب" }, { status: 500 });
  }
}
