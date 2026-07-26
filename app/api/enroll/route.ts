import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseById,
  getEnrollment,
  getUserById,
  createEnrollment,
  updateUser,
  createPayment,
  userHasActivePlatformSubscription,
} from "@/lib/db";
import { getCourseAccessFields, createNotification } from "@/lib/lms-spec-db";
import { recordLandingPageEventBySlug } from "@/lib/landing-pages-db";
import { trackMetaCapiServer } from "@/lib/meta-capi-server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "يجب تسجيل الدخول كطالب" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const landingPageSlug = searchParams.get("lp")?.trim() || undefined;
  if (!courseId) {
    return NextResponse.json({ error: "معرف الدورة مطلوب" }, { status: 400 });
  }

  const course = await getCourseById(courseId);
  if (!course || !(course as { isPublished?: boolean }).isPublished) {
    return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });
  }

  const access = await getCourseAccessFields(courseId);
  if (access?.accessType === "subscription_only") {
    const hasSub = await userHasActivePlatformSubscription(session.user.id);
    if (!hasSub) {
      return NextResponse.json(
        { error: "هذا الكورس متاح عبر اشتراك المنصة فقط. اشترك أولاً ثم عد هنا.", subscriptionRequired: true },
        { status: 400 },
      );
    }
    // مع اشتراك نشط لا حاجة لشراء منفرد
    return NextResponse.json({
      success: true,
      message: "يمكنك الوصول لهذا الكورس عبر اشتراك المنصة النشط",
      viaSubscription: true,
    });
  }

  const existing = await getEnrollment(session.user.id, courseId);
  if (existing) {
    return NextResponse.json({ error: "مسجّل في هذه الدورة مسبقاً" }, { status: 400 });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  const coursePrice = Number((course as { price?: string }).price) || 0;
  const userBalance = Number(user.balance) || 0;

  if (coursePrice > 0 && userBalance < coursePrice) {
    const needed = coursePrice - userBalance;
    return NextResponse.json(
      {
        error: `رصيدك غير كافٍ. سعر الدورة: ${coursePrice.toFixed(2)} ج.م، رصيدك: ${userBalance.toFixed(2)} ج.م. تحتاج: ${needed.toFixed(2)} ج.م`,
        insufficientBalance: true,
        coursePrice,
        userBalance,
      },
      { status: 400 },
    );
  }

  if (landingPageSlug) {
    await recordLandingPageEventBySlug(landingPageSlug, "checkout_start", {
      type: "course",
      courseId,
    }).catch(() => undefined);
  }

  if (coursePrice > 0) {
    const newBalance = String(Math.max(0, userBalance - coursePrice));
    await updateUser(session.user.id, { balance: newBalance });
    await createPayment(session.user.id, courseId, coursePrice);
  }
  await createEnrollment(session.user.id, courseId);

  const purchaseEventId = request.headers.get("x-meta-event-id")?.trim() || undefined;
  await trackMetaCapiServer("Purchase", {
    eventId: purchaseEventId,
    request,
    customData: {
      content_ids: [courseId],
      content_type: "product",
      content_name: "course",
      value: coursePrice,
      currency: "EGP",
      num_items: 1,
    },
    userData: {
      email: session.user.email,
      externalId: session.user.id,
      firstName: session.user.name?.split(/\s+/)[0] || session.user.name,
    },
  }).catch(() => undefined);

  if (landingPageSlug) {
    await recordLandingPageEventBySlug(landingPageSlug, "purchase", {
      type: "course",
      courseId,
    }).catch(() => undefined);
  }

  const courseTitle =
    (course as { titleAr?: string; title_ar?: string; title?: string }).titleAr ||
    (course as { title_ar?: string }).title_ar ||
    (course as { title?: string }).title ||
    "كورس";
  try {
    await createNotification({
      userId: session.user.id,
      type: "course_purchase",
      title: `تم شراء ${courseTitle}`,
      body: coursePrice > 0 ? `تم خصم ${coursePrice.toFixed(2)} ج.م من رصيدك` : "تم تفعيل الكورس مجاناً",
      link: `/courses/${(course as { slug?: string }).slug ?? ""}`,
    });
  } catch {
    /* إشعار اختياري */
  }

  return NextResponse.json({
    success: true,
    message: coursePrice > 0 ? `تم التسجيل وخصم ${coursePrice.toFixed(2)} ج.م من رصيدك` : "تم التسجيل بنجاح",
  });
}
