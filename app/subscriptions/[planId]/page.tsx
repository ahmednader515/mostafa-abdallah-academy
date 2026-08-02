import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategories,
  getSubscriptionPlanById,
  listLibraryCategoriesAll,
  listPlanCoverageByPlanIds,
  listSubscriptionPlansAll,
} from "@/lib/db";
import { listAllExternalTrainings } from "@/lib/lms-features-db";
import { subscriptionDurationLabel } from "@/lib/subscription-duration";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ planId: string }> };

export async function generateMetadata({ params }: Props) {
  const { planId } = await params;
  const t = await getServerTranslator();
  const plan = await getSubscriptionPlanById(planId).catch(() => null);
  if (!plan) return { title: t("subscriptions.detailsTitle", "Subscription details") };
  return {
    title: `${plan.name} | ${t("subscriptions.detailsTitle", "Subscription details")}`,
  };
}

export default async function SubscriptionPlanDetailsPage({ params }: Props) {
  const { planId } = await params;
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);

  const planRow = await getSubscriptionPlanById(planId).catch(() => null);
  if (!planRow || !planRow.is_active) {
    // Allow viewing inactive for admins via list fallback name only if found
    if (!planRow) notFound();
  }

  const [allPlans, courseCats, libraryCats, externals, covMap] = await Promise.all([
    listSubscriptionPlansAll().catch(() => []),
    getCategories().catch(() => []),
    listLibraryCategoriesAll().catch(() => []),
    listAllExternalTrainings().catch(() => []),
    listPlanCoverageByPlanIds([planId]),
  ]);

  const publicPlan = allPlans.find((p) => p.id === planId);
  const coversCourses = publicPlan?.coversCourses ?? true;
  const coversLibrary = publicPlan?.coversLibrary ?? true;
  const coversExternal = publicPlan?.coversExternalTraining ?? false;
  const cov = covMap.get(planId) ?? {
    courseCategoryIds: publicPlan?.courseCategoryIds ?? [],
    libraryCategoryIds: publicPlan?.libraryCategoryIds ?? [],
    externalTrainingIds: publicPlan?.externalTrainingIds ?? [],
  };

  const courseItems = coversCourses
    ? cov.courseCategoryIds.length
      ? courseCats
          .filter((c) => cov.courseCategoryIds.includes(c.id))
          .map((c) => ({
            id: c.id,
            label: pickLocalizedText(locale, c.name_ar, c.name) || c.name,
            href: c.slug ? `/courses/category/${encodeURIComponent(c.slug)}` : "/courses",
          }))
      : [
          {
            id: "__all_courses__",
            label: t("subscriptions.coverageAllCourses", "All course categories"),
            href: "/courses",
          },
        ]
    : [];

  const libraryItems = coversLibrary
    ? cov.libraryCategoryIds.length
      ? libraryCats
          .filter((c) => cov.libraryCategoryIds.includes(c.id))
          .map((c) => ({
            id: c.id,
            label: pickLocalizedText(locale, c.nameAr, c.name) || c.name,
            href: c.slug ? `/library/category/${encodeURIComponent(c.slug)}` : "/library",
          }))
      : [
          {
            id: "__all_library__",
            label: t("subscriptions.coverageAllLibrary", "All library categories"),
            href: "/library",
          },
        ]
    : [];

  const externalItems = coversExternal
    ? cov.externalTrainingIds.length
      ? externals
          .filter((e) => cov.externalTrainingIds.includes(e.id))
          .map((e) => ({
            id: e.id,
            label: pickLocalizedText(locale, e.titleAr, e.title) || e.title,
            href: `/external-training/${encodeURIComponent(e.id)}`,
          }))
      : externals
          .filter((e) => e.isPublished)
          .map((e) => ({
            id: e.id,
            label: pickLocalizedText(locale, e.titleAr, e.title) || e.title,
            href: `/external-training/${encodeURIComponent(e.id)}`,
          }))
    : [];

  const duration = subscriptionDurationLabel(planRow.duration_kind, (key, fb) => t(key, fb ?? key));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Link href="/#subscription-plans" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        ← {t("subscriptions.backToPlans", "Back to plans")}
      </Link>

      <h1 className="mt-4 text-3xl font-black text-[var(--color-foreground)]">{planRow.name}</h1>
      {planRow.description?.trim() ? (
        <p className="mt-2 text-[var(--color-muted)] whitespace-pre-wrap">{planRow.description}</p>
      ) : null}
      <p className="mt-3 text-sm text-[var(--color-muted)]">
        {t("subscriptions.detailsDuration", "Duration")}:{" "}
        <span className="font-semibold text-[var(--color-foreground)]">{duration}</span>
      </p>

      <section className="mt-10 space-y-8">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          {t("subscriptions.coveredContent", "Covered content")}
        </h2>

        <CoverageGroup
          title={t("subscriptions.coversCourses", "Courses")}
          empty={t("subscriptions.notCovered", "Not covered by this plan")}
          items={courseItems}
        />
        <CoverageGroup
          title={t("subscriptions.coversLibrary", "Library")}
          empty={t("subscriptions.notCovered", "Not covered by this plan")}
          items={libraryItems}
        />
        <CoverageGroup
          title={t("subscriptions.coversExternal", "External training")}
          empty={t("subscriptions.notCovered", "Not covered by this plan")}
          items={externalItems}
        />
      </section>

      <div className="mt-10">
        <Link
          href="/#subscription-plans"
          className="inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
        >
          {t("subscriptions.viewPlansCta", "View subscription plans")}
        </Link>
      </div>
    </div>
  );
}

function CoverageGroup({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { id: string; label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-muted)]">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="inline-flex text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
