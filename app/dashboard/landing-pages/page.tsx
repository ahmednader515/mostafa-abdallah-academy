import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listLandingPagesAdmin } from "@/lib/landing-pages-db";
import { getServerTranslator } from "@/lib/i18n/server";
import { LandingPagesAdminClient } from "./LandingPagesAdminClient";

export default async function LandingPagesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") {
    redirect("/dashboard");
  }
  const [t, pages] = await Promise.all([
    getServerTranslator(),
    listLandingPagesAdmin().catch(() => [] as Awaited<ReturnType<typeof listLandingPagesAdmin>>),
  ]);

  return (
    <div>
      <h2 className="text-xl font-bold">
        {t("landingPages.title", "Landing pages")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "landingPages.subtitle",
          "Create and manage unlimited landing pages with templates, CTAs, SEO, and conversion tracking.",
        )}
      </p>
      <LandingPagesAdminClient initialPages={pages} />
    </div>
  );
}
