import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getHomepageSettings,
  getLatestPlatformSubscriptionExpiry,
  listActiveSubscriptionPlansPublic,
  userHasActivePlatformSubscription,
} from "@/lib/db";
import { SubscriptionPlanCard } from "@/components/SubscriptionPlanCard";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { getDir } from "@/lib/i18n/core";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getServerTranslator();
  return {
    title: t("subscriptions.pageTitle", "Subscriptions"),
  };
}

export default async function SubscriptionsIndexPage() {
  const [session, t, locale, settings, plans] = await Promise.all([
    getServerSession(authOptions),
    getServerTranslator(),
    getLocaleFromCookie(),
    getHomepageSettings().catch(() => null),
    listActiveSubscriptionPlansPublic().catch(() => []),
  ]);

  const enabled = !!settings?.subscriptionsEnabled;
  const isStudent = session?.user?.role === "STUDENT";
  const isLoggedIn = !!session?.user?.id;

  let hasActive = false;
  let expiresAtIso: string | null = null;
  if (isStudent && session?.user?.id) {
    hasActive = await userHasActivePlatformSubscription(session.user.id).catch(() => false);
    if (hasActive) {
      const exp = await getLatestPlatformSubscriptionExpiry(session.user.id);
      expiresAtIso = exp ? exp.toISOString() : null;
    }
  }

  const dir = getDir(locale);

  return (
    <section className="px-4 py-14 sm:px-6" dir={dir}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-[var(--color-foreground)] sm:text-4xl">
            {t("subscriptions.pageTitle", "Subscriptions")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--color-muted)]">
            {t(
              "subscriptions.pageSubtitle",
              "Browse all available plans, compare coverage, and subscribe with your wallet balance.",
            )}
          </p>
        </div>

        {!enabled ? (
          <p className="mt-14 text-center text-[var(--color-muted)]">
            {t("subscriptions.featureDisabled", "Subscriptions are not available right now.")}
          </p>
        ) : plans.length === 0 ? (
          <p className="mt-14 text-center text-[var(--color-muted)]">
            {t(
              "subscriptions.emptyPlans",
              "No plans are available yet. Check back soon.",
            )}
          </p>
        ) : (
          <div className="mt-12 grid items-stretch justify-items-center gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {plans.map((p) => (
              <SubscriptionPlanCard
                key={p.id}
                plan={{
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  imageUrl: p.imageUrl,
                  durationKind: p.durationKind,
                  price: p.price,
                  discountPrice: p.discountPrice,
                  discountPercent: p.discountPercent,
                  buttonText: p.buttonText,
                  accentColor: p.accentColor,
                  badgeText: p.badgeText,
                  featuresJson: p.featuresJson,
                  sortOrder: p.sortOrder,
                  coversCourses: p.coversCourses,
                  coversLibrary: p.coversLibrary,
                  coversExternalTraining: p.coversExternalTraining,
                }}
                isStudent={isStudent}
                isLoggedIn={isLoggedIn}
                hasActivePlatformSubscription={hasActive}
                activePlatformSubscriptionExpiresAtIso={expiresAtIso}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
