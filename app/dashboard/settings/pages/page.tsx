import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { PagesCmsClient } from "./PagesCmsClient";

export default async function PagesCmsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();
  return (
    <div>
      <Link href="/dashboard" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        {t("dashboard.backToDashboard", "Back to dashboard")}
      </Link>
      <h2 className="mt-4 text-xl font-bold">{t("dashboard.pagesCms.title", "Pages & policies")}</h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {t("dashboard.pagesCms.intro", "Edit privacy, terms, and usage policy cards shown on the site.")}
      </p>
      <div className="mt-6">
        <PagesCmsClient />
      </div>
    </div>
  );
}
