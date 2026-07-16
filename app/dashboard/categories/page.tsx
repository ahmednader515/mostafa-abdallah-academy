import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getCategories } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { CategoriesAdminClient, type CategoryRow } from "./CategoriesAdminClient";

export default async function DashboardCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();

  let categories: CategoryRow[] = [];
  try {
    const rows = await getCategories();
    categories = rows.map((c) => {
      const r = c as unknown as Record<string, unknown>;
      return {
        id: String(r.id),
        name: String(r.name ?? ""),
        nameAr: (r.nameAr as string | undefined) ?? (r.name_ar as string | undefined) ?? null,
        slug: String(r.slug ?? ""),
        order: Number(r.order ?? 0),
        parentId: (r.parentId as string | undefined) ?? (r.parent_id as string | undefined) ?? null,
        isVisible: (r.isVisible as boolean | undefined) ?? (r.is_visible as boolean | undefined) ?? true,
        isPinned: (r.isPinned as boolean | undefined) ?? (r.is_pinned as boolean | undefined) ?? false,
        pinOrder: (r.pinOrder as number | undefined) ?? (r.pin_order as number | undefined) ?? null,
      };
    });
  } catch {
    /* قاعدة البيانات غير متصلة */
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboardNav.categories", "Categories")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.categoriesDescription",
          "Manage categories, sub-categories, visibility, and pinning to the top of the homepage list.",
        )}
      </p>
      <CategoriesAdminClient initialCategories={categories} />
    </div>
  );
}
