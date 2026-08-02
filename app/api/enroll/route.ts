import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseById,
  getEnrollment,
  getUserById,
  createEnrollment,
  createPayment,
  userHasActivePlatformSubscription,
} from "@/lib/db";
import { getCourseAccessFields, createNotification } from "@/lib/lms-spec-db";
import { recordLandingPageEventBySlug } from "@/lib/landing-pages-db";
import { trackMetaCapiServer } from "@/lib/meta-capi-server";
import { consumeCoupon, validateAndPreviewCoupon } from "@/lib/lms-features-db";
import { adjustWalletBalance } from "@/lib/wallet";

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

  let couponCode: string | undefined;
  try {
    const body = (await request.json()) as { couponCode?: string };
    couponCode = body.couponCode?.trim() || undefined;
  } catch {
    couponCode = undefined;
  }

  const course = await getCourseById(courseId);
  if (!course || !(course as { isPublished?: boolean }).isPublished) {
    return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });
  }

  const access = await getCourseAccessFields(courseId);
  if (access?.accessType === "subscription_only") {
    const { userCanAccessCourseViaSubscription } = await import("@/lib/subscription-access");
    const covered = await userCanAccessCourseViaSubscription(session.user.id, courseId);
    if (!covered) {
      const hasAnySub = await userHasActivePlatformSubscription(session.user.id);
      return NextResponse.json(
        {
          error: hasAnySub
            ? "هذا الكورس غير مشمول في اشتراكك الحالي. رقِّ اشتراكك أو اشترِ الكورس إن أمكن."
            : "هذا الكورس متاح عبر اشتراك المنصة فقط. اشترك أولاً ثم عد هنا.",
          subscriptionRequired: true,
          subscriptionUpgrade: hasAnySub,
        },
        { status: 400 },
      );
    }
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
  let payable = coursePrice;
  let appliedCouponId: string | null = null;

  if (couponCode && coursePrice > 0) {
    const preview = await validateAndPreviewCoupon({
      code: couponCode,
      scope: "course",
      originalPrice: coursePrice,
      targetId: courseId,
      userId: session.user.id,
    });
    if (!preview.ok) {
      return NextResponse.json({ error: preview.error }, { status: 400 });
    }
    payable = preview.discountedPrice;
    appliedCouponId = preview.coupon.id;
  }

  const userBalance = Number(user.balance) || 0;

  if (payable > 0 && userBalance < payable) {
    const needed = payable - userBalance;
    return NextResponse.json(
      {
        error: `رصيدك غير كافٍ. المبلغ المطلوب: ${payable.toFixed(2)} ج.م، رصيدك: ${userBalance.toFixed(2)} ج.م. تحتاج: ${needed.toFixed(2)} ج.م`,
        insufficientBalance: true,
        coursePrice: payable,
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

  if (payable > 0) {
    try {
      await adjustWalletBalance({
        userId: session.user.id,
        amount: -payable,
        type: "purchase",
        reason: `Course enrollment`,
        referenceType: "course",
        referenceId: courseId,
        createdBy: session.user.id,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "رصيدك غير كافٍ";
      return NextResponse.json({ error: msg, insufficientBalance: true }, { status: 400 });
    }
    await createPayment(session.user.id, courseId, payable);
  }
  await createEnrollment(session.user.id, courseId);

  if (appliedCouponId) {
    await consumeCoupon(appliedCouponId, {
      userId: session.user.id,
      scope: "course",
      targetId: courseId,
      originalPrice: coursePrice,
      discountedPrice: payable,
    }).catch(() => undefined);
  }

  const purchaseEventId = request.headers.get("x-meta-event-id")?.trim() || undefined;
  await trackMetaCapiServer("Purchase", {
    eventId: purchaseEventId,
    request,
    customData: {
      content_ids: [courseId],
      content_type: "product",
      content_name: "course",
      value: payable,
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
      body: payable > 0 ? `تم خصم ${payable.toFixed(2)} ج.م من رصيدك` : "تم تفعيل الكورس مجاناً",
      link: `/courses/${(course as { slug?: string }).slug ?? ""}`,
    });
  } catch {
    /* إشعار اختياري */
  }

  return NextResponse.json({
    success: true,
    pricePaid: payable,
    originalPrice: coursePrice,
    message: payable > 0 ? `تم التسجيل وخصم ${payable.toFixed(2)} ج.م من رصيدك` : "تم التسجيل بنجاح",
  });
}
