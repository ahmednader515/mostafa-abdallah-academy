import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { listForumCategories, listForumThreads } from "@/lib/forum-db";
import { ForumAdminClient } from "./ForumAdminClient";

export default async function ForumAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();
  const [categories, threads] = await Promise.all([
    listForumCategories(false, { withThreadCount: true }).catch(() => []),
    listForumThreads(null, 50).catch(() => []),
  ]);

  return (
    <div>
      <h2 className="text-xl font-bold">{t("dashboard.forum.title", "Forum admin")}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t("dashboard.forum.subtitle", "Moderate categories and recent threads. Newest first.")}
      </p>
      <div className="mt-6">
        <ForumAdminClient initialCategories={categories} initialThreads={threads} />
      </div>
      <div className="mt-6 rounded border border-[var(--color-border)] p-4">
        <h3 className="font-semibold">{t("dashboard.forum.approvalSettings", "Publishing settings")}</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t(
            "dashboard.forum.approvalHint",
            "Use Roles & permissions to control who can create topics and moderate. Thread pin/lock/delete is available above.",
          )}
        </p>
        <Link href="/dashboard/settings/permissions" className="mt-3 inline-flex text-sm text-[var(--color-primary)] hover:underline">
          {t("dashboard.forum.openPermissions", "Open permissions")}
        </Link>
      </div>
    </div>
  );
}
