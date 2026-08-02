"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export function BookConsultationButton({
  offerId,
  isLoggedIn,
}: {
  offerId: string;
  isLoggedIn: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function book() {
    setError("");
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/consultations/${offerId}`)}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/consultations/${encodeURIComponent(offerId)}/book`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : t("consultations.bookFailed", "تعذّر إرسال طلب الحجز"),
        );
      }
      const conversationId = data.conversationId as string | undefined;
      router.push(
        conversationId
          ? `/dashboard/messages?c=${encodeURIComponent(conversationId)}`
          : "/dashboard/messages",
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("consultations.bookFailed", "تعذّر إرسال طلب الحجز"),
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void book()}
        disabled={loading}
        className="inline-flex rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
      >
        {loading
          ? t("consultations.booking", "جاري الحجز…")
          : t("consultations.bookNow", "احجز الآن")}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
