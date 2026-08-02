"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrency } from "@/components/CurrencyProvider";
import { FormattedPrice } from "@/components/FormattedPrice";
import { useT } from "@/components/LocaleProvider";
import { newAnalyticsEventId, trackClientAnalytics, trackMetaEvent } from "@/lib/analytics-events";

function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), template);
}

export function EnrollButton({
  courseId,
  coursePrice,
  userBalance,
  landingSlug = "",
  hidePriceSummary = false,
}: {
  courseId: string;
  coursePrice: number;
  userBalance: number;
  landingSlug?: string;
  /** عند التضمين داخل بطاقة الشراء التي تعرض السعر بالفعل */
  hidePriceSummary?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeMessage, setCodeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const t = useT();
  const { formatPrice } = useCurrency();

  const effectivePrice = previewPrice != null ? previewPrice : coursePrice;
  const hasEnoughBalance = effectivePrice === 0 || userBalance >= effectivePrice;

  async function handleClick() {
    if (!hasEnoughBalance) {
      setError(
        fillTemplate(t("currency.insufficientBalance", "Insufficient balance. Course price: {coursePrice}, your balance: {balance}"), {
          coursePrice: formatPrice(coursePrice),
          balance: formatPrice(userBalance),
        }),
      );
      return;
    }
    setError("");
    setLoading(true);
    if (landingSlug) {
      trackClientAnalytics("landing_checkout_start", {
        landing_slug: landingSlug,
        type: "course",
        courseId,
      });
    }
    trackMetaEvent("InitiateCheckout", {
      content_ids: [courseId],
      content_type: "product",
      content_name: "course",
      value: coursePrice,
      currency: "EGP",
      num_items: 1,
    });
    const purchaseEventId = newAnalyticsEventId();
    const qs = new URLSearchParams({ courseId });
    if (landingSlug) qs.set("lp", landingSlug);
    const res = await fetch(`/api/enroll?${qs.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-meta-event-id": purchaseEventId,
      },
      body: JSON.stringify({
        couponCode: couponCode.trim() || undefined,
      }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? t("courses.enrollFailed", "Failed to enroll in course"));
      return;
    }
    if (landingSlug) {
      trackClientAnalytics("landing_purchase", {
        landing_slug: landingSlug,
        type: "course",
        courseId,
      });
    }
    trackMetaEvent(
      "Purchase",
      {
        content_ids: [courseId],
        content_type: "product",
        content_name: "course",
        value: coursePrice,
        currency: "EGP",
        num_items: 1,
        order_id: data.enrollmentId || purchaseEventId,
      },
      { eventId: purchaseEventId },
    );
    router.refresh();
  }

  async function handleActivateCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setCodeMessage({
        type: "error",
        text: t("codes.enterActivationCode", "Enter the activation code"),
      });
      return;
    }
    setCodeMessage(null);
    setCodeLoading(true);
    try {
      const res = await fetch("/api/activate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCodeMessage({
          type: "error",
          text: data.error ?? t("codes.activationFailed", "Code activation failed"),
        });
        return;
      }
      setCodeMessage({
        type: "success",
        text: data.message ?? t("codes.activationSuccess", "Code activated successfully"),
      });
      setCode("");
      router.refresh();
    } catch {
      setCodeMessage({
        type: "error",
        text: t("codes.activationErrorGeneric", "An error occurred during activation"),
      });
    } finally {
      setCodeLoading(false);
    }
  }

  return (
    <div className={hidePriceSummary ? "mt-0" : "mt-6"}>
      {coursePrice > 0 && !hidePriceSummary && (
        <div className="mb-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-muted)]">
              {t("courses.priceLabel", "Course price:")}
            </span>
            <span className="text-lg font-semibold text-[var(--color-foreground)]">
              <FormattedPrice amountEgp={coursePrice} />
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-[var(--color-muted)]">
              {t("wallet.currentBalanceLabel", "Your balance:")}
            </span>
            <span className={`text-lg font-semibold ${hasEnoughBalance ? "text-[var(--color-success)]" : "text-red-600"}`}>
              <FormattedPrice amountEgp={userBalance} />
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {t("currency.chargedInEgpNote", "Charges are deducted from your balance in EGP.")}
          </p>
          {!hasEnoughBalance && (
            <p className="mt-2 text-sm text-red-600">
              {fillTemplate(t("currency.needAdditional", "You need an additional {amount}."), {
                amount: formatPrice(coursePrice - userBalance),
              })}{" "}
              <Link href="/dashboard/wallet" className="font-medium underline">
                {t("wallet.topUp", "Top up balance")}
              </Link>
            </p>
          )}
        </div>
      )}
      {coursePrice > 0 && hidePriceSummary && !hasEnoughBalance && (
        <p className="mb-3 text-sm text-red-600">
          {fillTemplate(t("currency.needAdditional", "You need an additional {amount}."), {
            amount: formatPrice(coursePrice - userBalance),
          })}{" "}
          <Link href="/dashboard/wallet" className="font-medium underline">
            {t("wallet.topUp", "Top up balance")}
          </Link>
        </p>
      )}

      {coursePrice > 0 ? (
        <div className="mb-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)]/50 p-4">
          <p className="mb-2 text-sm font-medium text-[var(--color-foreground)]">
            {t("coupons.haveCoupon", "Have a discount coupon?")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setPreviewPrice(null);
                setCouponMsg("");
              }}
              placeholder={t("coupons.codePlaceholder", "Discount coupon code")}
              className="min-w-[160px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm"
              onClick={() => {
                void (async () => {
                  setCouponMsg("");
                  setPreviewPrice(null);
                  const c = couponCode.trim();
                  if (!c) return;
                  const res = await fetch("/api/coupons/validate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      code: c,
                      scope: "course",
                      originalPrice: coursePrice,
                      targetId: courseId,
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!data.ok) {
                    setCouponMsg(data.error ?? t("coupons.invalid", "Invalid coupon"));
                    return;
                  }
                  setPreviewPrice(Number(data.discountedPrice));
                  setCouponMsg(
                    t("coupons.appliedPreview", "Coupon applied. New price: {price}").replace(
                      "{price}",
                      formatPrice(Number(data.discountedPrice)),
                    ),
                  );
                })();
              }}
            >
              {t("coupons.apply", "Apply")}
            </button>
          </div>
          {couponMsg ? (
            <p className={`mt-2 text-sm ${previewPrice != null ? "text-green-600" : "text-red-600"}`}>{couponMsg}</p>
          ) : null}
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {t(
              "coupons.vsActivationHint",
              "Discount coupons reduce the price. For free access use an activation code below.",
            )}
          </p>
        </div>
      ) : null}

      <div className="mb-4 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)]/50 p-4">
        <p className="mb-3 text-sm font-medium text-[var(--color-foreground)]">
          {t("codes.haveActivationCode", "Have an activation code?")}
        </p>
        <form onSubmit={handleActivateCode} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t("codes.activationCodePlaceholder", "Enter activation code")}
            className="min-w-[160px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-mono placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            disabled={codeLoading}
          />
          <button
            type="submit"
            disabled={codeLoading}
            className="rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-50"
          >
            {codeLoading ? t("codes.activating", "Activating...") : t("codes.activate", "Activate code")}
          </button>
        </form>
        {codeMessage && (
          <p className={`mt-2 text-sm ${codeMessage.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {codeMessage.text}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-[var(--radius-btn)] bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || !hasEnoughBalance}
        className={`w-full rounded-[var(--radius-btn)] px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
          coursePrice > 0
            ? "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
            : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
        }`}
      >
        {loading
          ? t("courses.enrolling", "Enrolling...")
          : effectivePrice > 0
            ? fillTemplate(t("currency.buyCourse", "Buy course ({price})"), {
                price: formatPrice(effectivePrice),
              })
            : t("courses.enrollFree", "Enroll (Free)")}
      </button>
    </div>
  );
}
