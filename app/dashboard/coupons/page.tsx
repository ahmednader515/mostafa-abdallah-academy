import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listDiscountCoupons } from "@/lib/lms-features-db";
import { getServerTranslator } from "@/lib/i18n/server";
import { CouponsAdminClient } from "./CouponsAdminClient";

export default async function CouponsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const [t, coupons] = await Promise.all([
    getServerTranslator(),
    listDiscountCoupons().catch(() => [] as Awaited<ReturnType<typeof listDiscountCoupons>>),
  ]);

  return (
    <div>
      <h2 className="text-xl font-bold">{t("dashboard.coupons.title", "Coupons & discounts")}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.coupons.subtitle",
          "Create percent or fixed discounts for courses, library, or subscriptions.",
        )}
      </p>
      <CouponsAdminClient initialCoupons={coupons} />
    </div>
  );
}
