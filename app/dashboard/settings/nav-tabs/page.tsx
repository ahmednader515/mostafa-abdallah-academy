import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { parseNavTabs } from "@/lib/nav-tabs";
import { NavTabsAdminForm } from "./NavTabsAdminForm";

export default async function NavTabsSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();
  const settings = await getHomepageSettings().catch(() => null);
  const tabs = parseNavTabs(settings?.navTabsJson);

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.navTabs.title", "Sidebar tabs")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.navTabs.description",
          "Rename, reorder, change icons, and show or hide platform navigation tabs.",
        )}
      </p>
      <NavTabsAdminForm initialTabs={tabs} />
    </div>
  );
}
