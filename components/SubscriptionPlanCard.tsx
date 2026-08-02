"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useLocale, useT } from "@/components/LocaleProvider";
import { newAnalyticsEventId, trackMetaEvent } from "@/lib/analytics-events";
import { parseSubscriptionFeatures } from "@/lib/subscription-features";
import { subscriptionDurationLabel } from "@/lib/subscription-duration";
import { resolveSubscriptionPlanPricing } from "@/lib/subscription-pricing";

export type SubscriptionPlanCardData = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  durationKind: string;
  price: number;
  discountPrice?: number | null;
  discountPercent?: number | null;
  buttonText?: string | null;
  accentColor?: string | null;
  badgeText?: string | null;
  featuresJson?: string | null;
  sortOrder?: number;
  coversCourses?: boolean;
  coversLibrary?: boolean;
  coversExternalTraining?: boolean;
};

function normalizeAccentColor(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v) || /^#[0-9A-Fa-f]{3}$/.test(v)) return v;
  return null;
}

function isFeaturedBadge(badge: string | null | undefined): boolean {
  if (!badge?.trim()) return false;
  const b = badge.trim().toLowerCase();
  return (
    b.includes("popular") ||
    b.includes("شائع") ||
    b.includes("مميز") ||
    b.includes("featured") ||
    b.includes("الأكثر")
  );
}

const ADD_BALANCE_HREF = "/dashboard/wallet";

function formatRenewalDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

function CheckIcon({ color }: { color: string }) {
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
      style={{ backgroundColor: color }}
    >
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function CrossIcon() {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-border)] text-[var(--color-muted)]">
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M7 7 17 17M17 7 7 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function PlanIcon({
  imageUrl,
  accent,
  featured,
  diamond,
}: {
  imageUrl: string | null;
  accent: string;
  featured: boolean;
  diamond?: boolean;
}) {
  if (imageUrl) {
    return (
      <div
        className="relative mx-auto h-[4.25rem] w-[4.25rem] overflow-hidden rounded-full shadow-md"
        style={{ backgroundColor: `${accent}22` }}
      >
        <OptimizedImage src={imageUrl} alt="" fill sizes="68px" className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className="mx-auto flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full text-white shadow-md"
      style={{ backgroundColor: featured ? "#1e3a8a" : accent }}
    >
      {featured ? (
        <svg className="h-7 w-7 text-amber-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M5 16 3 7l5.5 4L12 4l3.5 7L21 7l-2 9H5Zm0 2h14v2H5v-2Z" />
        </svg>
      ) : diamond ? (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2 4 9l8 13 8-13-8-7Zm0 3.2 4.6 4L12 18.5 7.4 9.2 12 5.2Z" />
        </svg>
      ) : (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M3.5 12.2 20.5 4.5l-4.2 15.2-4.1-5.6L3.5 12.2Z" />
        </svg>
      )}
    </div>
  );
}

/** شريط خصم زاوية بدون تكرار النص */
function CornerDiscountRibbon({ label, color }: { label: string; color: string }) {
  return (
    <div className="pointer-events-none absolute left-0 top-0 z-[4] h-[5.5rem] w-[5.5rem] overflow-hidden rounded-tl-2xl">
      <div
        className="absolute left-[-40%] top-[22%] w-[150%] -rotate-45 py-[5px] text-center text-[11px] font-extrabold tracking-wide text-white shadow"
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
    </div>
  );
}

export function SubscriptionPlanCard({
  plan,
  isStudent,
  isLoggedIn,
  hasActivePlatformSubscription = false,
  activePlatformSubscriptionExpiresAtIso = null,
}: {
  plan: SubscriptionPlanCardData;
  isStudent: boolean;
  isLoggedIn: boolean;
  hasActivePlatformSubscription?: boolean;
  activePlatformSubscriptionExpiresAtIso?: string | null;
}) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const { formatPriceParts } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showAddBalanceLink, setShowAddBalanceLink] = useState(false);
  const [successExpiresAt, setSuccessExpiresAt] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponPreviewPrice, setCouponPreviewPrice] = useState<number | null>(null);
  const [couponMsg, setCouponMsg] = useState("");

  const pricing = resolveSubscriptionPlanPricing({
    price: plan.price,
    discountPrice: plan.discountPrice,
    discountPercent: plan.discountPercent,
  });
  const chargeParts = formatPriceParts(
    couponPreviewPrice != null ? couponPreviewPrice : pricing.chargePrice,
  );
  const compareParts =
    pricing.hasDiscount && pricing.compareAtPrice != null
      ? formatPriceParts(pricing.compareAtPrice)
      : null;

  const accent = normalizeAccentColor(plan.accentColor) ?? "#2563EB";
  const featured = isFeaturedBadge(plan.badgeText);
  const outlinedCta = !featured && !pricing.hasDiscount;
  const isPremiumStyle = !featured && pricing.hasDiscount;
  const checkColor = outlinedCta ? "#22C55E" : accent;
  const discountPillColor =
    pricing.discountPercent != null && pricing.discountPercent >= 35 ? "#EF4444" : "#2563EB";
  const ctaLabel =
    plan.buttonText?.trim() ||
    (featured
      ? t("subscriptions.startNow", "ابدأ الآن")
      : outlinedCta
        ? t("subscriptions.choosePlan", "اختر هذه الخطة")
        : t("subscriptions.buyNow", "اشترك الآن"));

  const features = useMemo(() => {
    const parsed = parseSubscriptionFeatures(plan.featuresJson);
    if (parsed.length) return parsed;
    return [
      { text: t("subscriptions.perkPaidAccess", "Full paid-course access"), included: true },
      { text: t("subscriptions.perkAllSections", "All sections"), included: true },
    ];
  }, [plan.featuresJson, t]);

  const saveLabel =
    pricing.hasDiscount && pricing.savingsAmount != null && pricing.savingsAmount > 0
      ? t("subscriptions.discountSave", "وفر {amount} {code}")
          .replace("{amount}", formatPriceParts(pricing.savingsAmount).amount)
          .replace("{code}", formatPriceParts(pricing.savingsAmount).code)
      : null;

  const discountPctNum =
    pricing.hasDiscount && pricing.discountPercent != null && pricing.discountPercent > 0
      ? pricing.discountPercent % 1 === 0
        ? String(pricing.discountPercent)
        : pricing.discountPercent.toFixed(1)
      : null;

  const activeSubExpiryFormatted =
    hasActivePlatformSubscription && activePlatformSubscriptionExpiresAtIso
      ? formatRenewalDate(activePlatformSubscriptionExpiresAtIso, locale)
      : null;

  async function purchase() {
    setErr("");
    setInfoMessage("");
    setShowAddBalanceLink(false);
    setSuccessExpiresAt(null);
    if (isStudent && hasActivePlatformSubscription) {
      const line = activeSubExpiryFormatted
        ? t(
            "subscriptions.activeUntil",
            "Your platform subscription is active until {date}. ",
          ).replace("{date}", activeSubExpiryFormatted)
        : t("subscriptions.alreadyActive", "You already have an active platform subscription. ");
      setInfoMessage(
        `${line}${t(
          "subscriptions.noRepurchase",
          "You do not need to pay again until that period ends.",
        )}`,
      );
      return;
    }
    setLoading(true);
    try {
      trackMetaEvent("InitiateCheckout", {
        content_ids: [plan.id],
        content_type: "product",
        content_name: plan.name,
        value: Number(pricing.chargePrice),
        currency: "EGP",
        num_items: 1,
      });
      const purchaseEventId = newAnalyticsEventId();
      const res = await fetch("/api/subscriptions/purchase", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-meta-event-id": purchaseEventId,
        },
        body: JSON.stringify({
          planId: plan.id,
          metaEventId: purchaseEventId,
          couponCode: couponCode.trim() || undefined,
        }),
      });
      let data: {
        success?: boolean;
        expiresAt?: string;
        error?: string;
        insufficientBalance?: boolean;
        alreadySubscribed?: boolean;
      } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        data = {};
      }
      if (!res.ok) {
        if (data.alreadySubscribed && typeof data.error === "string") {
          setInfoMessage(data.error);
        } else {
          setErr(
            typeof data.error === "string"
              ? data.error
              : t("subscriptions.purchaseFailed", "Could not complete purchase"),
          );
          setShowAddBalanceLink(!!data.insufficientBalance);
        }
        return;
      }
      if (typeof data.expiresAt !== "string" || !data.expiresAt.trim()) {
        setErr(
          t(
            "subscriptions.missingExpiry",
            "Request completed but expiry date was not returned. Refresh the page or check the dashboard.",
          ),
        );
        router.refresh();
        return;
      }
      trackMetaEvent(
        "Purchase",
        {
          content_ids: [plan.id],
          content_type: "product",
          content_name: plan.name,
          value: Number(pricing.chargePrice),
          currency: "EGP",
          num_items: 1,
          order_id: purchaseEventId,
        },
        { eventId: purchaseEventId },
      );
      setSuccessExpiresAt(data.expiresAt.trim());
      router.refresh();
    } catch {
      setErr(t("subscriptions.networkError", "Could not reach the server. Check your connection."));
    } finally {
      setLoading(false);
    }
  }

  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/subscriptions/${plan.id}`)}`;

  const coverageItems = [
    plan.coversCourses
      ? t("subscriptions.coversCourses", "Courses")
      : null,
    plan.coversLibrary
      ? t("subscriptions.coversLibrary", "Library")
      : null,
    plan.coversExternalTraining
      ? t("subscriptions.coversExternal", "External training")
      : null,
  ].filter(Boolean) as string[];
  const ctaBg = featured ? "#F5A623" : accent;

  return (
    <div className={`relative mx-auto w-full max-w-[22rem] ${plan.badgeText?.trim() ? "pt-3" : ""}`}>
      {/* شارة الأكثر شيوعاً — عائمة فوق منتصف أعلى البطاقة */}
      {plan.badgeText?.trim() ? (
        <div
          className="absolute left-1/2 top-3 z-[5] flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md"
          style={{ backgroundColor: featured ? "#F5A623" : accent }}
        >
          {featured ? (
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2.5 14.7 9l6.8.6-5.2 4.5 1.6 6.6L12 17.2 6.1 20.7l1.6-6.6L2.5 9.6 9.3 9 12 2.5Z" />
            </svg>
          ) : null}
          {plan.badgeText.trim()}
        </div>
      ) : null}

      <article
        className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-[var(--color-surface)] shadow-[0_8px_24px_rgba(15,23,42,0.07)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] ${
          featured ? "border-2 border-[#F5A623]" : "border-[var(--color-border)]"
        }`}
      >
      {discountPctNum ? (
        <CornerDiscountRibbon label={`${discountPctNum}%`} color={accent} />
      ) : null}

      <div className="flex flex-1 flex-col px-6 pb-6 pt-8">
        <PlanIcon
          imageUrl={plan.imageUrl}
          accent={accent}
          featured={featured}
          diamond={isPremiumStyle}
        />

        <h3 className="mt-4 text-center text-xl font-black text-[var(--color-foreground)]">
          {plan.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-center text-[13px] leading-relaxed text-[var(--color-muted)]">
          {plan.description?.trim() ||
            t(
              "subscriptions.defaultDescription",
              "Access all published paid courses for the full subscription period.",
            )}
        </p>

        <div className="mt-4 flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-sections)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-muted)]">
            {subscriptionDurationLabel(plan.durationKind, t)}
            <svg className="h-3.5 w-3.5 opacity-50" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </div>

        <div className="mt-5 text-center">
          <p className="flex items-baseline justify-center gap-1.5" dir="ltr">
            <span className="text-[2.35rem] font-black leading-none tabular-nums" style={{ color: accent }}>
              {chargeParts.amount}
            </span>
            <span className="text-base font-bold" style={{ color: accent }}>
              {chargeParts.code}
            </span>
          </p>

          {pricing.hasDiscount && compareParts ? (
            <div className="mt-3 flex flex-col items-center gap-2">
              {saveLabel ? (
                <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-[var(--color-success)]">
                  {saveLabel}
                </span>
              ) : null}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm text-[var(--color-muted)] line-through decoration-[var(--color-muted)]" dir="ltr">
                  {compareParts.amount} {compareParts.code}
                </span>
                {discountPctNum ? (
                  <span
                    className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                    style={{ backgroundColor: discountPillColor }}
                  >
                    {t("subscriptions.discountPercent", "خصم {percent}%").replace(
                      "{percent}",
                      discountPctNum,
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-3 inline-flex rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-[11px] font-semibold text-[var(--color-primary)]">
              {t("subscriptions.noDiscount", "لا يوجد خصم حالياً")}
            </p>
          )}
        </div>

        <ul className="mt-6 space-y-3">
          {features.map((f) => (
            <li
              key={f.text}
              className="flex items-start gap-2.5 text-[13px] leading-snug text-[var(--color-foreground)]"
            >
              {/* في RTL الأيقونة يمين النص — flex + gap يكفي مع dir الأب */}
              {f.included ? <CheckIcon color={checkColor} /> : <CrossIcon />}
              <span className={f.included ? "font-medium" : "text-[var(--color-muted)]"}>{f.text}</span>
            </li>
          ))}
        </ul>

        {coverageItems.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {t("subscriptions.coveredContent", "Covered content")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {coverageItems.map((label) => (
                <span
                  key={label}
                  className="inline-flex rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-primary)]"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {isStudent && !hasActivePlatformSubscription && pricing.chargePrice > 0 ? (
          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponPreviewPrice(null);
                  setCouponMsg("");
                }}
                placeholder={t("coupons.codePlaceholder", "Discount coupon code")}
                className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-mono text-[var(--color-foreground)]"
              />
              <button
                type="button"
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-foreground)]"
                onClick={() => {
                  void (async () => {
                    setCouponMsg("");
                    setCouponPreviewPrice(null);
                    const c = couponCode.trim();
                    if (!c) return;
                    const res = await fetch("/api/coupons/validate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        code: c,
                        scope: "subscription",
                        originalPrice: pricing.chargePrice,
                        targetId: plan.id,
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!data.ok) {
                      setCouponMsg(data.error ?? t("coupons.invalid", "Invalid coupon"));
                      return;
                    }
                    setCouponPreviewPrice(Number(data.discountedPrice));
                    setCouponMsg(
                      t("coupons.appliedPreview", "Coupon applied. New price: {price}").replace(
                        "{price}",
                        formatPriceParts(Number(data.discountedPrice)).amount +
                          " " +
                          formatPriceParts(Number(data.discountedPrice)).code,
                      ),
                    );
                  })();
                }}
              >
                {t("coupons.apply", "Apply")}
              </button>
            </div>
            {couponMsg ? (
              <p className={`text-xs ${couponPreviewPrice != null ? "text-green-600" : "text-red-600"}`}>
                {couponMsg}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto pt-6">
          {isStudent && hasActivePlatformSubscription ? (
            <Link
              href={`/subscriptions/${encodeURIComponent(plan.id)}`}
              className="block w-full rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3.5 text-center text-sm font-bold text-[var(--color-success)] transition hover:bg-emerald-500/25"
            >
              {t("subscriptions.youAreSubscribed", "Subscribed — details")}
            </Link>
          ) : isStudent ? (
            <button
              type="button"
              onClick={() => void purchase()}
              disabled={loading}
              className={`w-full rounded-xl px-4 py-3.5 text-sm font-bold transition disabled:opacity-60 ${
                outlinedCta
                  ? "border-2 bg-[var(--color-surface)] hover:bg-[var(--color-sections)]"
                  : "text-white shadow-sm hover:opacity-95"
              }`}
              style={
                outlinedCta
                  ? { borderColor: accent, color: accent }
                  : { backgroundColor: ctaBg }
              }
            >
              {loading ? t("subscriptions.buying", "Purchasing…") : ctaLabel}
            </button>
          ) : isLoggedIn ? (
            <p className="rounded-xl bg-[var(--color-sections)] px-4 py-3 text-center text-xs text-[var(--color-muted)]">
              {t("subscriptions.studentsOnly", "Students only")}
            </p>
          ) : (
            <Link
              href={loginHref}
              className={`block w-full rounded-xl px-4 py-3.5 text-center text-sm font-bold transition ${
                outlinedCta
                  ? "border-2 bg-[var(--color-surface)] hover:bg-[var(--color-sections)]"
                  : "text-white shadow-sm hover:opacity-95"
              }`}
              style={
                outlinedCta
                  ? { borderColor: accent, color: accent }
                  : { backgroundColor: ctaBg }
              }
            >
              {ctaLabel}
            </Link>
          )}
          <Link
            href={`/subscriptions/${encodeURIComponent(plan.id)}`}
            className="mt-2 block text-center text-xs font-semibold text-[var(--color-muted)] underline-offset-2 hover:text-[var(--color-foreground)] hover:underline"
          >
            {t("subscriptions.viewDetails", "التفاصيل")}
          </Link>
          <p className="mt-2 text-center text-[11px] text-[var(--color-muted)]">
            {t("subscriptions.cancelAnytime", "يمكن إلغاء الاشتراك في أي وقت")}
          </p>
        </div>

        {infoMessage ? (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/15 p-3 text-center text-sm text-amber-800 dark:text-amber-200">
            {infoMessage}
          </div>
        ) : null}
        {successExpiresAt ? (
          <div className="mt-4 space-y-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-center">
            <p className="font-bold text-[var(--color-success)]">
              {t("subscriptions.successTitle", "Subscription successful")}
            </p>
            <p className="text-sm text-[var(--color-foreground)]/90">
              {t("subscriptions.successExpiry", "Current subscription ends:")}{" "}
              <span className="font-semibold">{formatRenewalDate(successExpiresAt, locale)}</span>
            </p>
            <Link
              href="/courses"
              className="mt-1 inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {t("subscriptions.goToCourses", "Go to courses")}
            </Link>
          </div>
        ) : null}
        {err ? (
          <div className="mt-4 space-y-2 text-center">
            <p className="text-sm text-red-600">{err}</p>
            {showAddBalanceLink ? (
              <Link
                href={ADD_BALANCE_HREF}
                className="inline-flex rounded-xl border border-[var(--color-primary)]/50 px-4 py-2 text-sm font-semibold text-[var(--color-primary)]"
              >
                {t("subscriptions.addBalance", "Add balance to your account")}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
      </article>
    </div>
  );
}
