import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createForumReply,
  deleteForumThread,
  getForumThreadById,
  listForumReplies,
  setForumThreadLocked,
  setForumThreadPinned,
} from "@/lib/forum-db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const thread = await getForumThreadById(id);
    if (!thread) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    const replies = await listForumReplies(id);
    return NextResponse.json({ thread, replies });
  } catch (e) {
    console.error("GET /api/forum/[id]", e);
    return NextResponse.json({ error: "فشل الجلب" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  }
  const { id } = await params;
  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const text = body.body?.trim();
  if (!text) return NextResponse.json({ error: "نص الرد مطلوب" }, { status: 400 });
  try {
    const { id: replyId } = await createForumReply({
      threadId: id,
      authorId: session.user.id,
      body: text,
    });
    return NextResponse.json({ success: true, id: replyId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل إضافة الرد";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  let body: { pinned?: boolean; locked?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  try {
    if (body.pinned !== undefined) await setForumThreadPinned(id, !!body.pinned);
    if (body.locked !== undefined) await setForumThreadLocked(id, !!body.locked);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/forum/[id]", e);
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { id } = await params;
  const thread = await getForumThreadById(id);
  if (!thread) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  const isStaff = session.user.role === "ADMIN" || session.user.role === "ASSISTANT_ADMIN";
  if (!isStaff && thread.authorId !== session.user.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  await deleteForumThread(id);
  return NextResponse.json({ success: true });
}
