"use client";

import { SubscriptionPlanCard, type SubscriptionPlanCardData } from "@/components/SubscriptionPlanCard";
import { useLocale, useT } from "@/components/LocaleProvider";

/** قسم الاشتراكات — مطابق للتصميم المرجعي ومتوافق مع الوضع الداكن */
export function HomeSubscriptionsSection({
  enabled,
  plans,
  isStudent,
  isLoggedIn,
  studentPlatformSubscription,
}: {
  enabled: boolean;
  plans: SubscriptionPlanCardData[];
  isStudent: boolean;
  isLoggedIn: boolean;
  studentPlatformSubscription?: { active: boolean; expiresAtIso: string | null } | null;
}) {
  const t = useT();
  const locale = useLocale();
  if (!enabled) return null;

  function scrollToPlans() {
    document.getElementById("subscription-plans")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const highlights = [
    {
      title: t("subscriptions.highlightLearnTitle", "تعلم في أي وقت"),
      subtitle: t("subscriptions.highlightLearnSub", "تعلم على أي جهاز"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: t("subscriptions.highlightQualityTitle", "محتوى عالي الجودة"),
      subtitle: t("subscriptions.highlightQualitySub", "كورسات محدثة باستمرار"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="m10 10 5 2.5-5 2.5V10Z" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: t("subscriptions.highlightCertTitle", "شهادة إتمام معتمدة"),
      subtitle: t("subscriptions.highlightCertSub", "شهادات معتمدة لكل كورس"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3 4.5 6.5v5c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9v-5L12 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <section
      className="bg-[var(--color-background)] py-14"
      aria-labelledby="home-subscriptions-heading"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex flex-col items-center text-center">
          <button
            type="button"
            onClick={scrollToPlans}
            className="absolute end-0 top-0 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] shadow-sm hover:bg-[var(--color-sections)]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 7h8v2H8V7Zm-2 4h6v2H6v-2Zm2 4h8v2H8v-2Zm10-9.5L14.5 9l3.5 3.5V9H22V7h-4V3.5L14.5 7 18 10.5V7Z" />
            </svg>
            {t("subscriptions.comparePlans", "مقارنة الخطط")}
          </button>

          <h2
            id="home-subscriptions-heading"
            className="text-[2rem] font-black leading-tight text-[var(--color-foreground)] sm:text-4xl md:text-[2.75rem]"
          >
            {t("subscriptions.sectionTitle", "الاشتراكات المتاحة")}
          </h2>
          <div className="mt-3 flex h-[3px] w-40 overflow-hidden rounded-full sm:w-52">
            <span className="h-full w-[62%] bg-[var(--color-primary)]" />
            <span className="h-full w-[38%] bg-[var(--color-accent)]" />
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-[15px]">
            {t(
              "subscriptions.sectionSubtitle",
              "اشترك لفترة محددة واستمتع بكل الكورسات المدفوعة المشمولة في باقتك والوصول إلى كل المزايا",
            )}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-[var(--shadow-card,0_1px_3px_rgba(15,23,42,0.04))]"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                {h.icon}
              </span>
              <div className="min-w-0 text-start">
                <p className="truncate text-sm font-bold text-[var(--color-foreground)]">{h.title}</p>
                <p className="truncate text-xs text-[var(--color-muted)]">{h.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {plans.length === 0 ? (
          <p className="mt-14 text-center text-[var(--color-muted)]">
            {t(
              "subscriptions.emptyPlans",
              "لا توجد باقات حالياً. أضف باقات من لوحة التحكم ← إنشاء اشتراكات المنصة.",
            )}
          </p>
        ) : (
          <div
            id="subscription-plans"
            className="mt-12 grid items-stretch justify-items-center gap-8 pt-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          >
            {plans.map((p) => (
              <SubscriptionPlanCard
                key={p.id}
                plan={p}
                isStudent={isStudent}
                isLoggedIn={isLoggedIn}
                hasActivePlatformSubscription={!!studentPlatformSubscription?.active}
                activePlatformSubscriptionExpiresAtIso={
                  studentPlatformSubscription?.expiresAtIso ?? null
                }
              />
            ))}
          </div>
        )}

        <div className="mt-12 flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-sections)] px-5 py-4 sm:px-7">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3 4.5 6.5v5c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9v-5L12 3Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <div className="text-start">
            <h3 className="text-sm font-bold text-[var(--color-foreground)] sm:text-base">
              {t("subscriptions.guaranteeTitle", "ضمان استرداد الأموال")}
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)] sm:text-sm">
              {t("subscriptions.guaranteeBodyBefore", "إذا لم تكن راضياً يمكنك طلب استرداد كامل خلال")}{" "}
              <span className="font-bold text-[var(--color-primary)] underline decoration-[var(--color-primary)]/40 underline-offset-2">
                {t("subscriptions.guaranteeDays", "7 أيام")}
              </span>{" "}
              {t("subscriptions.guaranteeBodyAfter", "من الاشتراك.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
