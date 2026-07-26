import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listAllExternalTrainings } from "@/lib/lms-features-db";
import { getServerTranslator } from "@/lib/i18n/server";
import { ExternalTrainingAdminClient } from "./ExternalTrainingAdminClient";

export default async function ExternalTrainingAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const [t, pages] = await Promise.all([
    getServerTranslator(),
    listAllExternalTrainings().catch(() => [] as Awaited<ReturnType<typeof listAllExternalTrainings>>),
  ]);
  return (
    <div>
      <h2 className="text-xl font-bold">{t("dashboard.externalTraining.title", "External training")}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.externalTraining.subtitle",
          "Add external training portals. Students open them with one click without typing credentials.",
        )}
      </p>
      <ExternalTrainingAdminClient initialPages={pages} />
    </div>
  );
}
