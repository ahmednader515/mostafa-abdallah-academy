import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getLatestPlatformSubscriptionExpiry,
  userHasActivePlatformSubscription,
} from "@/lib/db";
import { makeTranslator } from "@/lib/i18n/core";
import type { Locale } from "@/lib/i18n/types";

/**
 * Streams independently so the shell / homepage hero are not blocked
 * on student subscription lookups.
 */
export async function StudentSubscriptionExpiryBanner({ locale }: { locale: Locale }) {
  const t = makeTranslator(locale);
  const session = await getServerSession(authOptions).catch(() => null);
  if (session?.user?.role !== "STUDENT" || !session.user.id) return null;

  try {
    const active = await userHasActivePlatformSubscription(session.user.id);
    if (!active) return null;

    const exp = await getLatestPlatformSubscriptionExpiry(session.user.id);
    const label = exp
      ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(exp)
      : t("header.active", "نشط");

    return (
      <div className="border-t border-[#2563EB]/35 bg-[#1e3a8a]/40 py-2 text-center text-xs text-blue-50 sm:text-sm">
        <span className="font-semibold text-blue-200">
          {t("header.platformSubscriptionActive", "You are subscribed to the platform subscription")}
        </span>
        {" — "}
        <span>
          {t("header.endsAt", "Expires at:")}{" "}
          <time className="font-medium text-white">{label}</time>
        </span>
      </div>
    );
  } catch {
    return null;
  }
}
