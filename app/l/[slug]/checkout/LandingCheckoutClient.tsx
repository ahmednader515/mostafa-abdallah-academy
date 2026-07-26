"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { newAnalyticsEventId, trackClientAnalytics, trackMetaEvent } from "@/lib/analytics-events";
import { useT } from "@/components/LocaleProvider";

export function LandingCheckoutClient({ slug }: { slug: string }) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const type = searchParams.get("type") || "";
  const id = searchParams.get("id") || "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      const callback = encodeURIComponent(`/l/${slug}/checkout?type=${type}&id=${id}`);
      router.replace(`/login?callbackUrl=${callback}`);
    }
  }, [status, router, slug, type, id]);

  async function purchase() {
    if (!id || loading) return;
    setLoading(true);
    setError("");
    trackClientAnalytics("landing_checkout_start", {
      landing_slug: slug,
      type,
      targetId: id,
    });
    trackMetaEvent("InitiateCheckout", {
      content_ids: [id],
      content_type: "product",
      content_name: type || "landing_checkout",
      currency: "EGP",
      num_items: 1,
    });
    const purchaseEventId = newAnalyticsEventId();

    let res: Response;
    if (type === "subscription" || type === "library_plan") {
      res = await fetch("/api/subscriptions/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-meta-event-id": purchaseEventId,
        },
        body: JSON.stringify({ planId: id, landingPageSlug: slug, metaEventId: purchaseEventId }),
      });
    } else if (type === "store_product") {
      res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-meta-event-id": purchaseEventId,
        },
        body: JSON.stringify({ productId: id, landingPageSlug: slug, metaEventId: purchaseEventId }),
      });
    } else {
      setError(t("landingPages.invalidCheckout", "Invalid checkout type"));
      setLoading(false);
      return;
    }

    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t("landingPages.checkoutFailed", "Checkout failed"));
      if (data.insufficientBalance) {
        setTimeout(() => router.push("/dashboard/add-balance"), 1500);
      }
      return;
    }
    trackClientAnalytics("landing_purchase", {
      landing_slug: slug,
      type,
      targetId: id,
    });
    trackMetaEvent(
      "Purchase",
      {
        content_ids: [id],
        content_type: "product",
        content_name: type || "landing_purchase",
        value: typeof data.pricePaid === "number" ? data.pricePaid : undefined,
        currency: "EGP",
        num_items: 1,
        order_id: purchaseEventId,
      },
      { eventId: purchaseEventId },
    );
    setDone(true);
  }

  if (status === "loading" || status === "unauthenticated") {
    return <p className="p-8 text-center text-sm">{t("common.loading", "Loading…")}</p>;
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t("landingPages.purchaseSuccess", "Purchase completed")}</h1>
        <Link href={`/l/${slug}`} className="mt-6 inline-block underline">
          {t("landingPages.backToPage", "Back to landing page")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t("landingPages.checkoutTitle", "Complete purchase")}</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {t("landingPages.checkoutHint", "Confirm to complete your purchase from this landing page.")}
      </p>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        disabled={loading || !id}
        onClick={() => void purchase()}
        className="mt-8 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {loading
          ? t("landingPages.processing", "Processing…")
          : t("landingPages.confirmPurchase", "Confirm purchase")}
      </button>
      <div className="mt-4">
        <Link href={`/l/${slug}`} className="text-sm underline">
          {t("common.cancel", "Cancel")}
        </Link>
      </div>
    </div>
  );
}
