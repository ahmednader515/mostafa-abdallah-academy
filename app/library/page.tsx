import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getHomepageSettings,
  listLibraryCategoriesAll,
  listStudentStorePurchases,
  listStoreProductsPublic,
} from "@/lib/db";
import { getActiveSubscriptionAccess } from "@/lib/subscription-access";
import { getServerTranslator } from "@/lib/i18n/server";
import { LibraryBrowseClient } from "./LibraryBrowseClient";
import { LibraryPageReadyBeacon } from "./LibraryPageReadyBeacon";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const settings = await getHomepageSettings().catch(() => null);
  const session = await getServerSession(authOptions);
  const t = await getServerTranslator();
  const [products, categories] = await Promise.all([
    listStoreProductsPublic().catch(() => []),
    listLibraryCategoriesAll().catch(() => []),
  ]);

  let librarySubscriptionAccess = {
    active: false,
    allCategories: false,
    categoryIds: [] as string[],
  };
  let purchasedProductIds: string[] = [];
  if (session?.user?.role === "STUDENT" && session.user.id) {
    const access = await getActiveSubscriptionAccess(session.user.id).catch(() => null);
    if (access?.active && access.coversLibrary) {
      librarySubscriptionAccess = {
        active: true,
        allCategories: access.legacyAllLibrary,
        categoryIds: access.libraryCategoryIds,
      };
    }
    const purchases = await listStudentStorePurchases(session.user.id).catch(() => []);
    purchasedProductIds = purchases.map((p) => p.productId);
  }

  // أظهر المكتبة دائماً إن وُجد محتوى؛ وإلا رسالة عند تعطيل المتجر وخلوّه
  const storeEnabled = settings?.storeEnabled !== false;
  if (!storeEnabled && products.length === 0) {
    return (
      <>
        <LibraryPageReadyBeacon />
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              {t("library.pageTitle", "Library")}
            </h1>
            <p className="mt-3 text-[var(--color-muted)]">
              {t("library.disabled", "The platform library is not available right now.")}
            </p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <LibraryPageReadyBeacon />
      <LibraryBrowseClient
        products={products}
        categories={categories}
        librarySubscriptionAccess={librarySubscriptionAccess}
        isLoggedIn={!!session}
        purchasedProductIds={purchasedProductIds}
      />
    </>
  );
}
