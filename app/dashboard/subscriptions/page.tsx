import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getCategories,
  getSubscriptionsFeatureEnabled,
  listLibraryCategoriesAll,
  listSubscriptionPlansAll,
} from "@/lib/db";
import { listAllExternalTrainings } from "@/lib/lms-features-db";
import { SubscriptionsAdminClient, type AdminPlanRow, type CoverageOption } from "./SubscriptionsAdminClient";

export default async function SubscriptionsDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const enabled = await getSubscriptionsFeatureEnabled();
  let plans: AdminPlanRow[] = [];
  try {
    const rows = await listSubscriptionPlansAll();
    plans = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl,
      durationKind: r.durationKind,
      price: r.price,
      discountPrice: r.discountPrice,
      discountPercent: r.discountPercent,
      buttonText: r.buttonText,
      accentColor: r.accentColor,
      badgeText: r.badgeText,
      featuresJson: r.featuresJson,
      sortOrder: r.sortOrder,
      isActive: r.isActive,
      coversCourses: r.coversCourses,
      coversLibrary: r.coversLibrary,
      coversExternalTraining: r.coversExternalTraining,
      courseCategoryIds: r.courseCategoryIds ?? [],
      libraryCategoryIds: r.libraryCategoryIds ?? [],
      externalTrainingIds: r.externalTrainingIds ?? [],
    }));
  } catch {
    plans = [];
  }

  const [courseCats, libraryCats, externals] = await Promise.all([
    getCategories().catch(() => []),
    listLibraryCategoriesAll().catch(() => []),
    listAllExternalTrainings().catch(() => []),
  ]);

  const courseCategoryOptions: CoverageOption[] = courseCats.map((c) => {
    const ar =
      (c as { nameAr?: string | null }).nameAr?.trim() ||
      (c as { name_ar?: string | null }).name_ar?.trim() ||
      "";
    return { id: c.id, label: ar || c.name };
  });
  const libraryCategoryOptions: CoverageOption[] = libraryCats.map((c) => ({
    id: c.id,
    label: c.nameAr?.trim() || c.name,
  }));
  const externalTrainingOptions: CoverageOption[] = externals.map((e) => ({
    id: e.id,
    label: e.titleAr?.trim() || e.title,
  }));

  return (
    <SubscriptionsAdminClient
      initialEnabled={enabled}
      initialPlans={plans}
      courseCategoryOptions={courseCategoryOptions}
      libraryCategoryOptions={libraryCategoryOptions}
      externalTrainingOptions={externalTrainingOptions}
    />
  );
}
