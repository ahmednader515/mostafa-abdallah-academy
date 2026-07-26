import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getLandingPageById, getLandingPageStats } from "@/lib/landing-pages-db";
import { getServerTranslator } from "@/lib/i18n/server";
import { LandingPageEditorClient } from "./LandingPageEditorClient";

type Props = { params: Promise<{ id: string }> };

export default async function LandingPageEditPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") {
    redirect("/dashboard");
  }
  const { id } = await params;
  const [t, page] = await Promise.all([
    getServerTranslator(),
    getLandingPageById(id),
  ]);
  if (!page) notFound();
  const stats = await getLandingPageStats(page.id);

  return (
    <div>
      <h2 className="text-xl font-bold">
        {t("landingPages.editTitle", "Edit landing page")}: {page.internalName}
      </h2>
      <LandingPageEditorClient initialPage={page} initialStats={stats} />
    </div>
  );
}
