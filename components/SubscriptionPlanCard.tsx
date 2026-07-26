"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useLocale, useT } from "@/components/LocaleProvider";
import { newAnalyticsEventId, trackMetaEvent } from "@/lib/analytics-events";

export type SubscriptionPlanCardData = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  durationKind: string;
  price: number;
};

function durationLabel(kind: string, t: (key: string, fallback: string) => string): string {
  if (kind === "week") return t("subscriptions.durationWeek", "Week");
  if (kind === "month") return t("subscriptions.durationMonth", "Month");
  if (kind === "year") return t("subscriptions.durationYear", "Year");
  return kind;
}

const ADD_BALANCE_HREF = "/dashboard/add-balance";

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
        value: Number(plan.price),
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
        body: JSON.stringify({ planId: plan.id, metaEventId: purchaseEventId }),
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
          value: Number(plan.price),
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

  const { amount: priceAmount, code: priceCode } = formatPriceParts(Number(plan.price));
  const loginHref = `/login?callbackUrl=${encodeURIComponent("/")}`;

  return (
    <article className="subscription-plan-card mx-auto flex max-w-sm flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-border)]">
        {plan.imageUrl ? (
          <OptimizedImage
            src={plan.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, 384px"
            className="object-cover"
            quality={70}
          />
        ) : null}
        {isStudent && hasActivePlatformSubscription ? (
          <div className="pointer-events-none absolute start-3 top-3 z-[1] rounded-full border border-emerald-500/40 bg-emerald-600 px-3 py-1 text-center text-[11px] font-bold text-white shadow-md sm:text-xs">
            {t("subscriptions.badgeActive", "Subscribed")}
          </div>
        ) : null}
        <div className="pointer-events-none absolute end-0 top-0 z-[1] origin-top-end translate-x-1/4 -translate-y-1/4 rotate-45 bg-[var(--color-primary)] px-10 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white shadow-md rtl:-translate-x-1/4 rtl:rotate-[-45deg]">
          {t("subscriptions.badge", "Plan")}
        </div>
      </div>

      <div className="relative z-[2] -mt-8 rounded-t-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-6 pt-12 sm:px-6 sm:pt-14">
        <div className="absolute left-1/2 top-0 z-[3] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border-2 border-amber-500/40 bg-gradient-to-b from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg sm:px-8 sm:py-3 sm:text-base">
          {durationLabel(plan.durationKind, t)}
        </div>

        <div className="flex flex-row items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h3 className="text-start text-xl font-bold leading-snug text-[var(--color-foreground)]">
              {plan.name}
            </h3>
            {isStudent && hasActivePlatformSubscription ? (
              <p className="text-start text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                {activeSubExpiryFormatted
                  ? t(
                      "subscriptions.activeDetailUntil",
                      "You are subscribed until {date}. No need to buy this plan again before it ends.",
                    ).replace("{date}", activeSubExpiryFormatted)
                  : t(
                      "subscriptions.activeDetail",
                      "You are subscribed. No need to buy this plan again before the current period ends.",
                    )}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2.5">
            {isStudent ? (
              <Link
                href="/courses"
                className="rounded-xl border-2 border-[var(--color-primary)] px-3 py-2 text-center text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/5"
              >
                {t("common.courses", "Courses")}
              </Link>
            ) : (
              <Link
                href={loginHref}
                className="rounded-xl border-2 border-[var(--color-primary)] px-3 py-2 text-center text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/5"
              >
                {t("header.login", "Log in")}
              </Link>
            )}
            {isStudent ? (
              <button
                type="button"
                onClick={purchase}
                disabled={loading}
                className={`min-w-[9.5rem] rounded-xl px-5 py-3.5 text-center text-sm font-bold shadow-lg transition sm:min-w-[10.5rem] sm:px-6 sm:py-4 sm:text-base ${
                  hasActivePlatformSubscription
                    ? "border border-emerald-500/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-100"
                    : "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                }`}
              >
                {loading
                  ? t("subscriptions.buying", "Purchasing…")
                  : hasActivePlatformSubscription
                    ? t("subscriptions.youAreSubscribed", "Subscribed — details")
                    : t("subscriptions.buyNow", "Buy now")}
              </button>
            ) : isLoggedIn ? (
              <span className="rounded-xl bg-[var(--color-border)]/60 px-3 py-2 text-center text-[10px] text-[var(--color-muted)]">
                {t("subscriptions.studentsOnly", "Students only")}
              </span>
            ) : (
              <Link
                href={loginHref}
                className="rounded-xl bg-amber-500 px-3 py-2 text-center text-xs font-semibold text-white shadow-md transition hover:bg-amber-600"
              >
                {t("subscriptions.buyAsStudent", "Buy as student")}
              </Link>
            )}
          </div>
        </div>

        <div className="my-4 space-y-2">
          <div className="h-px w-full bg-[var(--color-primary)]/70" />
          <div className="h-px w-full bg-[var(--color-border)]" />
        </div>

        {plan.description?.trim() ? (
          <p className="text-start text-sm leading-relaxed text-[var(--color-muted)]">
            {plan.description.trim()}
          </p>
        ) : (
          <p className="text-start text-sm text-[var(--color-muted)]">
            {t(
              "subscriptions.defaultDescription",
              "Access all published paid courses for the full subscription period.",
            )}
          </p>
        )}

        <div className="mt-6 flex flex-row items-end justify-between gap-3 border-t border-[var(--color-border)] pt-4">
          <div className="space-y-1 text-start text-xs text-[var(--color-muted)]">
            <p>{t("subscriptions.perkPaidAccess", "Full paid-course access")}</p>
            <p>{t("subscriptions.perkAllSections", "All sections")}</p>
          </div>
          <div className="flex shrink-0 items-stretch overflow-hidden rounded-lg text-sm font-bold shadow-md ring-1 ring-[var(--color-border)]">
            <span className="flex items-center bg-[var(--color-primary)] px-2.5 py-2 text-[10px] font-bold uppercase text-white">
              {priceCode}
            </span>
            <span className="flex items-center bg-[var(--color-foreground)] px-3 py-2 text-[var(--color-surface)] tabular-nums">
              {priceAmount}
            </span>
          </div>
        </div>

        {infoMessage ? (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-center text-sm leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            {infoMessage}
          </div>
        ) : null}

        {successExpiresAt ? (
          <div
            className="mt-4 space-y-2 rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 text-center dark:bg-emerald-950/40"
            role="status"
          >
            <p className="text-base font-bold text-emerald-800 dark:text-emerald-200">
              {t("subscriptions.successTitle", "Subscription successful")}
            </p>
            <p className="text-sm leading-relaxed text-emerald-900/90 dark:text-emerald-100/95">
              {t("subscriptions.successExpiry", "Current subscription ends:")}{" "}
              <span className="font-semibold">{formatRenewalDate(successExpiresAt, locale)}</span>
            </p>
            <Link
              href="/courses"
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-90"
            >
              {t("subscriptions.goToCourses", "Go to courses")}
            </Link>
          </div>
        ) : null}

        {err ? (
          <div className="mt-4 space-y-2 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
            {showAddBalanceLink ? (
              <Link
                href={ADD_BALANCE_HREF}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/15"
              >
                {t("subscriptions.addBalance", "Add balance to your account")}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
