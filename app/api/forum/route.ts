import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createForumThread,
  getForumCategoryById,
  listForumCategoriesForUser,
  listForumThreads,
  userCanCreateInCategory,
} from "@/lib/forum-db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isLoggedIn = Boolean(session?.user?.id);
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  try {
    const categories = await listForumCategoriesForUser(role, isLoggedIn, {
      withThreadCount: true,
    });
    const allowedIds = categories.map((c) => c.id);
    if (categoryId && !allowedIds.includes(categoryId)) {
      return NextResponse.json({ categories, threads: [] });
    }
    const threads = await listForumThreads(categoryId || null, 80, {
      allowedCategoryIds: allowedIds,
    });
    return NextResponse.json({ categories, threads });
  } catch (e) {
    console.error("GET /api/forum", e);
    return NextResponse.json({ error: "فشل جلب المنتدى" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  }
  let body: { categoryId?: string; title?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const categoryId = body.categoryId?.trim();
  const title = body.title?.trim();
  const text = body.body?.trim();
  if (!categoryId || !title || !text) {
    return NextResponse.json({ error: "القسم والعنوان والنص مطلوبة" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "العنوان طويل جداً" }, { status: 400 });
  }

  try {
    const category = await getForumCategoryById(categoryId);
    if (!category) {
      return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
    }
    if (!userCanCreateInCategory(category, session.user.role, true)) {
      return NextResponse.json(
        { error: category.isLocked ? "هذا القسم مقفل" : "غير مسموح بالنشر في هذا القسم" },
        { status: 403 },
      );
    }
    const { id } = await createForumThread({
      categoryId,
      authorId: session.user.id,
      title,
      body: text,
    });
    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error("POST /api/forum", e);
    return NextResponse.json({ error: "فشل إنشاء الموضوع" }, { status: 500 });
  }
}
