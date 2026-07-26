import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLessonWatchProgress, upsertLessonWatchProgress } from "@/lib/lms-features-db";
type Context = { params: Promise<{ lessonId: string }> };
export async function GET(_request: NextRequest, { params }: Context) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  return NextResponse.json({ progress: await getLessonWatchProgress(session.user.id, (await params).lessonId) });
}
export async function POST(request: NextRequest, { params }: Context) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  try { const body = await request.json(); const progress = await upsertLessonWatchProgress({ userId: session.user.id, lessonId: (await params).lessonId, seconds: Number(body.seconds), percent: Number(body.percent) }); return NextResponse.json({ progress }); }
  catch { return NextResponse.json({ error: "بيانات المشاهدة غير صالحة" }, { status: 400 }); }
}
