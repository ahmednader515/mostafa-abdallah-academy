import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getSubscriptionPlanById,
  getSubscriptionsFeatureEnabled,
  purchasePlatformSubscription,
  resolveSubscriptionPlanPricing,
} from "@/lib/db";
import { recordLandingPageEventBySlug } from "@/lib/landing-pages-db";
import { trackMetaCapiServer } from "@/lib/meta-capi-server";
import { consumeCoupon, validateAndPreviewCoupon } from "@/lib/lms-features-db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "يجب تسجيل الدخول كطالب" }, { status: 403 });
  }
  const enabled = await getSubscriptionsFeatureEnabled();
  if (!enabled) {
    return NextResponse.json({ error: "ميزة الاشتراكات غير مفعّلة" }, { status: 400 });
  }
  let body: { planId?: string; landingPageSlug?: string; metaEventId?: string; couponCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const planId = body.planId?.trim();
  if (!planId) return NextResponse.json({ error: "معرف الباقة مطلوب" }, { status: 400 });
  const landingPageSlug = body.landingPageSlug?.trim();
  const purchaseEventId =
    body.metaEventId?.trim() || request.headers.get("x-meta-event-id")?.trim() || undefined;
  const couponCode = body.couponCode?.trim();

  try {
    const plan = await getSubscriptionPlanById(planId);
    if (!plan || !plan.is_active) {
      return NextResponse.json({ error: "الباقة غير متاحة" }, { status: 400 });
    }
    const basePrice = resolveSubscriptionPlanPricing({
      price: plan.price,
      discountPrice: plan.discount_price,
      discountPercent: plan.discount_percent,
    }).chargePrice;

    let priceOverride: number | undefined;
    let appliedCouponId: string | null = null;
    if (couponCode && basePrice > 0) {
      const preview = await validateAndPreviewCoupon({
        code: couponCode,
        scope: "subscription",
        originalPrice: basePrice,
        targetId: planId,
        userId: session.user.id,
      });
      if (!preview.ok) {
        return NextResponse.json({ error: preview.error }, { status: 400 });
      }
      priceOverride = preview.discountedPrice;
      appliedCouponId = preview.coupon.id;
    }

    if (landingPageSlug) {
      await recordLandingPageEventBySlug(landingPageSlug, "checkout_start", {
        type: "subscription",
        planId,
      });
    }
    const { expiresAt, pricePaid } = await purchasePlatformSubscription(session.user.id, planId, {
      priceOverride,
    });

    if (appliedCouponId) {
      await consumeCoupon(appliedCouponId, {
        userId: session.user.id,
        scope: "subscription",
        targetId: planId,
        originalPrice: basePrice,
        discountedPrice: pricePaid,
      }).catch(() => undefined);
    }

    if (landingPageSlug) {
      await recordLandingPageEventBySlug(landingPageSlug, "purchase", {
        type: "subscription",
        planId,
      });
    }
    await trackMetaCapiServer("Purchase", {
      eventId: purchaseEventId,
      request,
      customData: {
        content_ids: [planId],
        content_type: "product",
        content_name: "subscription",
        currency: "EGP",
        value: pricePaid,
        num_items: 1,
      },
      userData: {
        email: session.user.email,
        externalId: session.user.id,
        firstName: session.user.name?.split(/\s+/)[0] || session.user.name,
      },
    }).catch(() => undefined);
    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
      pricePaid,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل الشراء";
    const lower = msg.toLowerCase();
    if (msg.includes("مشترك في المنصة بالفعل")) {
      return NextResponse.json({ error: msg, alreadySubscribed: true }, { status: 400 });
    }
    if (lower.includes("رصيد") || lower.includes("غير كاف")) {
      return NextResponse.json({ error: msg, insufficientBalance: true }, { status: 400 });
    }
    if (lower.includes("غير متاح") || lower.includes("طلاب")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("POST subscriptions/purchase", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
