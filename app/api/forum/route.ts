import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createForumThread,
  listForumCategories,
  listForumThreads,
} from "@/lib/forum-db";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  try {
    const [categories, threads] = await Promise.all([
      listForumCategories(true),
      listForumThreads(categoryId || null, 80),
    ]);
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
