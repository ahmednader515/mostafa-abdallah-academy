import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getStoreFeatureEnabled,
  getHomepageSettings,
  listLibraryCategoriesAll,
  listStoreProductsAll,
  listStorePurchasesForAdmin,
  getStoreSalesStats,
} from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { requireStaffPermission } from "@/lib/require-permission";
import { LibraryAdminClient } from "./LibraryAdminClient";

export default async function LibraryDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const gate = await requireStaffPermission(
    session.user.id,
    session.user.role,
    "canManageLibrary",
  );
  if (!gate.ok) redirect("/dashboard");

  const t = await getServerTranslator();

  const [enabled, homepage] = await Promise.all([
    getStoreFeatureEnabled(),
    getHomepageSettings().catch(() => null),
  ]);
  const [products, categories, purchases, stats] = await Promise.all([
    listStoreProductsAll().catch(() => []),
    listLibraryCategoriesAll().catch(() => []),
    listStorePurchasesForAdmin().catch(() => []),
    getStoreSalesStats().catch(() => ({
      purchasesCount: 0,
      buyersCount: 0,
      soldProductsCount: 0,
      revenue: 0,
      totalCost: 0,
      totalProfit: 0,
      profitMarginPercent: null,
      byProduct: [],
    })),
  ]);

  const initialHomeStoreTitle =
    homepage?.storeSectionTitle?.trim() || t("dashboard.libraryAdminDefaults.sectionTitleFallback");
  const initialHomeStoreDescription =
    homepage?.storeSectionDescription?.trim() ||
    t("dashboard.libraryAdminDefaults.sectionDescriptionFallback");

  return (
    <LibraryAdminClient
      initialEnabled={enabled}
      initialHomeStoreTitle={initialHomeStoreTitle}
      initialHomeStoreDescription={initialHomeStoreDescription}
      initialProducts={products}
      initialCategories={categories}
      initialPurchases={purchases}
      initialStats={stats}
    />
  );
}
