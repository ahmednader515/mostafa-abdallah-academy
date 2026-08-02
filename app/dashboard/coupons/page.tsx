import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listDiscountCoupons } from "@/lib/lms-features-db";
import { getCoursesAll, listSubscriptionPlansAll, listStoreProductsAll } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { requireStaffPermission } from "@/lib/require-permission";
import { CouponsAdminClient } from "./CouponsAdminClient";

export default async function CouponsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const gate = await requireStaffPermission(
    session.user.id,
    session.user.role,
    "canManageCoupons",
  );
  if (!gate.ok) redirect("/dashboard");

  const [t, coupons, courses, plans, storeProducts] = await Promise.all([
    getServerTranslator(),
    listDiscountCoupons().catch(() => [] as Awaited<ReturnType<typeof listDiscountCoupons>>),
    getCoursesAll().catch(() => []),
    listSubscriptionPlansAll().catch(() => []),
    listStoreProductsAll().catch(() => []),
  ]);

  const courseOptions = courses
    .map((c) => ({
      id: String((c as { id?: unknown }).id ?? ""),
      title: (c as { title_ar?: string; title: string }).title_ar ?? (c as { title: string }).title,
    }))
    .filter((o) => o.id);

  const planOptions = plans
    .map((p) => ({
      id: String((p as { id?: unknown }).id ?? ""),
      name: (p as { name: string }).name,
    }))
    .filter((o) => o.id);

  const storeOptions = storeProducts
    .map((p) => ({
      id: String((p as { id?: unknown }).id ?? ""),
      title: (p as { title: string }).title,
    }))
    .filter((o) => o.id);

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.coupons.title", "Coupons & discounts")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.coupons.subtitle",
          "Create percent or fixed price discounts for courses, library, subscriptions, or store products.",
        )}
      </p>
      <CouponsAdminClient
        initialCoupons={coupons}
        courseOptions={courseOptions}
        planOptions={planOptions}
        storeOptions={storeOptions}
      />
    </div>
  );
}
