import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLessonWatchProgress, upsertLessonWatchProgress } from "@/lib/watch-progress-db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lessonId = request.nextUrl.searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  const progress = await getLessonWatchProgress(session.user.id, lessonId);
  return NextResponse.json({ progress });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const lessonId = String(body.lessonId || "");
    const seconds = Number(body.seconds) || 0;
    const percent = Math.min(100, Math.max(0, Number(body.percent) || 0));
    if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });
    await upsertLessonWatchProgress({
      userId: session.user.id,
      lessonId,
      seconds,
      percent,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
