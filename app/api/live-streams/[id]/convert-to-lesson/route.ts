import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageCourse } from "@/lib/permissions";
import { getLiveStreamById, getCourseById, getLessonsByCourseId, createLesson } from "@/lib/db";

/** يحوّل بثًا مباشرًا منتهيًا إلى حصة مسجّلة داخل نفس الكورس (يستخدم رابط التسجيل أو رابط الاجتماع كفيديو) */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;

  const stream = await getLiveStreamById(id);
  if (!stream) return NextResponse.json({ error: "البث غير موجود" }, { status: 404 });

  const courseId = (stream as { courseId?: string | null; course_id?: string | null }).courseId ?? stream.course_id ?? null;
  if (!courseId) {
    return NextResponse.json({ error: "لا يمكن تحويل بث غير مرتبط بكورس" }, { status: 400 });
  }

  const course = await getCourseById(courseId);
  if (!course) return NextResponse.json({ error: "الكورس غير موجود" }, { status: 404 });
  const createdById =
    (course as { createdById?: string | null; created_by_id?: string | null }).createdById ??
    (course as { created_by_id?: string | null }).created_by_id ??
    null;
  if (!canManageCourse(session.user.role, session.user.id, createdById)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const videoUrl =
    (stream as { recordingUrl?: string | null }).recordingUrl?.trim() ||
    (stream as { recording_url?: string | null }).recording_url?.trim() ||
    stream.meeting_url?.trim() ||
    null;
  if (!videoUrl) {
    return NextResponse.json({ error: "لا يوجد رابط تسجيل أو اجتماع لتحويله لفيديو" }, { status: 400 });
  }

  try {
    const existingLessons = await getLessonsByCourseId(courseId);
    const maxOrder = existingLessons.reduce((max, l) => Math.max(max, Number(l.order) || 0), -1);
    const baseSlug = (course.slug || "lesson").toString();
    const lessonSlug = `${baseSlug}-live-${id.slice(-6)}`.replace(/\s+/g, "-");

    const lesson = await createLesson({
      course_id: courseId,
      title: stream.title,
      title_ar: stream.title_ar ?? null,
      slug: lessonSlug,
      content: stream.description ?? null,
      video_url: videoUrl,
      order: maxOrder + 1,
    });

    return NextResponse.json({ success: true, lesson });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل تحويل البث إلى حصة" }, { status: 500 });
  }
}
