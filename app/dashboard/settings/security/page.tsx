import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { SecuritySettingsClient } from "./SecuritySettingsClient";

export default async function SecuritySettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();
  return (
    <div>
      <Link href="/dashboard" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        {t("dashboard.backToDashboard", "Back to dashboard")}
      </Link>
      <h2 className="mt-4 text-xl font-bold">{t("dashboard.security.title", "Security & logs")}</h2>
      <div className="mt-6">
        <SecuritySettingsClient />
      </div>
    </div>
  );
}
