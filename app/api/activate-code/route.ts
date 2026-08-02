import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActivationCodeByCode, useActivationCode, getEnrollment } from "@/lib/db";

/** تفعيل كود مجاني — كورس أو اشتراك منصة — للطالب فقط */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "يجب تسجيل الدخول كطالب" }, { status: 403 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "كود التفعيل مطلوب" }, { status: 400 });
  }

  const row = await getActivationCodeByCode(code);
  if (!row) {
    return NextResponse.json({ error: "كود غير صالح أو منتهٍ أو استُهلك بالكامل" }, { status: 404 });
  }

  if (row.targetType === "course" && row.courseId) {
    const alreadyEnrolled = await getEnrollment(session.user.id, row.courseId);
    const isPartial = row.lessonIds.length > 0 || row.quizIds.length > 0;
    if (alreadyEnrolled && !isPartial) {
      return NextResponse.json({ error: "أنت مسجّل أصلاً في هذه الدورة" }, { status: 400 });
    }
  }

  try {
    const result = await useActivationCode(row.id, session.user.id);
    if (!result) {
      return NextResponse.json({ error: "كود غير صالح أو مستخدم مسبقاً" }, { status: 404 });
    }

    if (result.targetType === "subscription") {
      return NextResponse.json({
        success: true,
        message: result.expiresAt
          ? `تم تفعيل اشتراك المنصة مجاناً حتى ${result.expiresAt.toISOString()}`
          : "تم تفعيل اشتراك المنصة مجاناً",
        planId: result.planId,
        targetType: "subscription",
        expiresAt: result.expiresAt?.toISOString() ?? null,
      });
    }

    const isPartial = (result.lessonIds?.length ?? 0) > 0 || (result.quizIds?.length ?? 0) > 0;
    return NextResponse.json({
      success: true,
      message: isPartial
        ? "تم تفعيل الكود وإتاحة حصص محددة داخل الدورة بنجاح"
        : "تم تفعيل الكود والتسجيل في الدورة بنجاح",
      courseId: result.courseId,
      targetType: "course",
      scope: isPartial ? "partial" : "full",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل تفعيل الكود";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
