import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listActivationCodes,
  listActivationCodesForTeacher,
  createActivationCodes,
  deleteActivationCodes,
  getCourseById,
  getSubscriptionPlanById,
} from "@/lib/db";
import { canManageCourse } from "@/lib/permissions";

/** قائمة أكواد التفعيل — للأدمن/مساعد الأدمن/المعلم */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "ADMIN" &&
      session.user.role !== "ASSISTANT_ADMIN" &&
      session.user.role !== "TEACHER")
  ) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId") || undefined;
    const codes =
      session.user.role === "TEACHER"
        ? await listActivationCodesForTeacher(session.user.id, courseId ?? null)
        : await listActivationCodes(courseId ?? null);
    return NextResponse.json(codes);
  } catch (error) {
    console.error("Dashboard codes GET:", error);
    return NextResponse.json({ error: "فشل جلب الأكواد" }, { status: 500 });
  }
}

/** إنشاء أكواد تفعيل — كورس أو اشتراك */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "ADMIN" &&
      session.user.role !== "ASSISTANT_ADMIN" &&
      session.user.role !== "TEACHER")
  ) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: {
    targetType?: string;
    courseId?: string;
    planId?: string;
    count?: number;
    lessonIds?: string[];
    quizIds?: string[];
    expiresAt?: string | null;
    maxUses?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const targetType = body.targetType === "subscription" ? "subscription" : "course";
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 500);
  const maxUses = Math.max(1, Math.floor(Number(body.maxUses) || 1));
  const lessonIds = Array.isArray(body.lessonIds) ? body.lessonIds.filter((x) => typeof x === "string") : [];
  const quizIds = Array.isArray(body.quizIds) ? body.quizIds.filter((x) => typeof x === "string") : [];

  if (targetType === "subscription") {
    if (session.user.role === "TEACHER") {
      return NextResponse.json({ error: "المعلمون يمكنهم إنشاء أكواد كورسات فقط" }, { status: 403 });
    }
    const planId = body.planId?.trim();
    if (!planId) return NextResponse.json({ error: "معرف باقة الاشتراك مطلوب" }, { status: 400 });
    const plan = await getSubscriptionPlanById(planId);
    if (!plan) return NextResponse.json({ error: "باقة الاشتراك غير موجودة" }, { status: 404 });
    try {
      const created = await createActivationCodes({
        targetType: "subscription",
        planId,
        count,
        expiresAt: body.expiresAt ?? null,
        maxUses,
      });
      return NextResponse.json({ created, count: created.length });
    } catch (error) {
      console.error("Dashboard codes POST subscription:", error);
      return NextResponse.json({ error: "فشل إنشاء الأكواد" }, { status: 500 });
    }
  }

  const courseId = body.courseId?.trim();
  if (!courseId) {
    return NextResponse.json({ error: "معرف الدورة مطلوب" }, { status: 400 });
  }
  if (session.user.role === "TEACHER") {
    const course = await getCourseById(courseId);
    const createdBy = course
      ? ((course as { createdById?: string | null; created_by_id?: string | null }).createdById ??
        (course as { created_by_id?: string | null }).created_by_id ??
        null)
      : null;
    if (!course || !canManageCourse("TEACHER", session.user.id, createdBy)) {
      return NextResponse.json({ error: "غير مصرح بتعديل هذه الدورة" }, { status: 403 });
    }
  }
  try {
    const created = await createActivationCodes({
      targetType: "course",
      courseId,
      count,
      lessonIds: lessonIds.length > 0 ? lessonIds : null,
      quizIds: quizIds.length > 0 ? quizIds : null,
      expiresAt: body.expiresAt ?? null,
      maxUses,
    });
    return NextResponse.json({ created, count: created.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Dashboard codes POST:", error);
    if (
      msg.includes("ActivationCode") ||
      msg.includes("ActivationCodeLesson") ||
      msg.includes("does not exist") ||
      msg.includes("relation")
    ) {
      return NextResponse.json(
        {
          error:
            "جداول أكواد التفعيل غير موجودة/ناقصة. نفّذ scripts/add-activation-codes.sql من لوحة Neon ثم أعد المحاولة.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: msg || "فشل إنشاء الأكواد" }, { status: 500 });
  }
}

/** حذف أكواد بالمعرفات */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "ADMIN" &&
      session.user.role !== "ASSISTANT_ADMIN" &&
      session.user.role !== "TEACHER")
  ) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: { ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  let ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string") : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "لم يتم تحديد أكواد للحذف" }, { status: 400 });
  }
  if (session.user.role === "TEACHER") {
    const mine = await listActivationCodesForTeacher(session.user.id);
    const allowed = new Set(mine.map((x) => String((x as { id?: string }).id ?? "")));
    ids = ids.filter((id) => allowed.has(id));
    if (ids.length === 0) {
      return NextResponse.json({ error: "لا يمكن حذف أكواد غير تابعة لكورساتك" }, { status: 403 });
    }
  }
  try {
    await deleteActivationCodes(ids);
    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("Dashboard codes DELETE:", error);
    return NextResponse.json({ error: "فشل حذف الأكواد" }, { status: 500 });
  }
}
