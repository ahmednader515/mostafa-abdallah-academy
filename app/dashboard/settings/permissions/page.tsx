import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { PermissionsAdminClient } from "./PermissionsAdminClient";

export default async function PermissionsSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();
  return (
    <div>
      <Link href="/dashboard" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        {t("dashboard.backToDashboard", "Back to dashboard")}
      </Link>
      <h2 className="mt-4 text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.permissions.title", "Roles & permissions")}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.permissions.intro",
          "Grant granular permissions by role or user. Templates can be applied and edited anytime.",
        )}
      </p>
      <div className="mt-6">
        <PermissionsAdminClient />
      </div>
    </div>
  );
}
