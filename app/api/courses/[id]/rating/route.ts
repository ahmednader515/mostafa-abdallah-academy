import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseById,
  getCourseRatingSummary,
  getEnrollment,
  hasFullCourseAccessAsStudent,
  upsertCourseRating,
} from "@/lib/db";

async function canRateCourse(userId: string, role: string, courseId: string): Promise<boolean> {
  if (role === "ADMIN" || role === "ASSISTANT_ADMIN") return true;
  if (await getEnrollment(userId, courseId)) return true;
  if (role === "STUDENT" && (await hasFullCourseAccessAsStudent(userId, courseId))) return true;
  return false;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const course = await getCourseById(courseId);
    if (!course) return NextResponse.json({ error: "الكورس غير موجود" }, { status: 404 });

    const session = await getServerSession(authOptions);
    const summary = await getCourseRatingSummary(course.id, session?.user?.id ?? null);
    const canRate = session?.user?.id
      ? await canRateCourse(session.user.id, session.user.role, course.id)
      : false;

    return NextResponse.json({ summary, canRate });
  } catch (err) {
    const message = err instanceof Error ? err.message : "تعذر تحميل التقييم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { id: courseId } = await params;
    const course = await getCourseById(courseId);
    if (!course) return NextResponse.json({ error: "الكورس غير موجود" }, { status: 404 });

    const allowed = await canRateCourse(session.user.id, session.user.role, course.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "يجب الاشتراك في الكورس أولاً لتقييمه" },
        { status: 403 }
      );
    }

    let body: { rating?: unknown; comment?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
    }

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "التقييم يجب أن يكون من 1 إلى 5" }, { status: 400 });
    }

    const comment =
      body.comment != null && String(body.comment).trim()
        ? String(body.comment).trim().slice(0, 1000)
        : null;

    await upsertCourseRating({
      course_id: course.id,
      user_id: session.user.id,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      comment,
    });

    const summary = await getCourseRatingSummary(course.id, session.user.id);
    return NextResponse.json({ success: true, summary, canRate: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "تعذر حفظ التقييم";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
