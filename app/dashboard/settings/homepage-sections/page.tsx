import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getHomepageSections } from "@/lib/lms-spec-db";
import { getServerTranslator } from "@/lib/i18n/server";
import { HomepageSectionsForm } from "./HomepageSectionsForm";

export default async function DashboardHomepageSectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();

  let sections: Awaited<ReturnType<typeof getHomepageSections>> = [];
  try {
    sections = await getHomepageSections();
  } catch {
    /* قاعدة البيانات غير متصلة */
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboardNav.homepageSections", "Homepage sections")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.homepageSectionsDescription",
          "Control which sections appear on the homepage, their order, visibility, and pinning to the top.",
        )}
      </p>
      <HomepageSectionsForm initialSections={sections} />
    </div>
  );
}
