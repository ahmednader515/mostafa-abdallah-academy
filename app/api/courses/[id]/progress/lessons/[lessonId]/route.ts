import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseWithContent,
  getEnrollment,
  hasFullCourseAccessAsStudent,
  markLessonCompleted,
  getCourseProgressForUser,
} from "@/lib/db";

type Props = { params: Promise<{ id: string; lessonId: string }> };

export async function POST(_request: Request, { params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  }

  const { id: courseId, lessonId } = await params;
  if (!courseId || !lessonId) {
    return NextResponse.json({ error: "معاملات غير صالحة" }, { status: 400 });
  }

  const role = session.user.role;
  if (role !== "STUDENT" && role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const data = await getCourseWithContent(courseId);
  if (!data?.course) {
    return NextResponse.json({ error: "الكورس غير موجود" }, { status: 404 });
  }
  const course = data.course as { id: string };
  const lessonExists = data.lessons.some((l: { id?: string }) => String(l.id) === lessonId);
  if (!lessonExists) {
    return NextResponse.json({ error: "الحصة غير موجودة" }, { status: 404 });
  }

  const isStaff = role === "ADMIN" || role === "ASSISTANT_ADMIN";
  if (!isStaff) {
    const enrolled = await getEnrollment(session.user.id, course.id);
    const fullAccess = role === "STUDENT" ? await hasFullCourseAccessAsStudent(session.user.id, course.id) : false;
    if (!enrolled && !fullAccess) {
      return NextResponse.json({ error: "غير مسجّل في هذا الكورس" }, { status: 403 });
    }
  }

  await markLessonCompleted(session.user.id, lessonId, course.id);

  const lessons = data.lessons.map((l: { id: string }) => ({ id: String(l.id) }));
  const quizzes = (data.quizzes ?? []).map((q: { id: string }) => ({ id: String(q.id) }));
  const progress = await getCourseProgressForUser(session.user.id, course.id, lessons, quizzes);

  return NextResponse.json({
    success: true,
    progress,
    courseCompleted: progress.isComplete,
  });
}
