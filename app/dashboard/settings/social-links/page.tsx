import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listSocialLinks } from "@/lib/lms-spec-db";
import { getServerTranslator } from "@/lib/i18n/server";
import { SocialLinksAdmin } from "./SocialLinksAdmin";

export default async function DashboardSocialLinksPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();

  let links: Awaited<ReturnType<typeof listSocialLinks>> = [];
  try {
    links = await listSocialLinks();
  } catch {
    /* قاعدة البيانات غير متصلة */
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboardNav.socialLinks", "Social links")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.socialLinksDescription",
          "Manage the social network links shown across the platform (sidebar, footer, etc).",
        )}
      </p>
      <SocialLinksAdmin initialLinks={links} />
    </div>
  );
}
