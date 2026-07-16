import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAllPlatformLabels } from "@/lib/lms-spec-db";
import { getServerTranslator } from "@/lib/i18n/server";
import { LabelsSettingsForm } from "./LabelsSettingsForm";

export default async function DashboardLabelsSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();

  let labels: Awaited<ReturnType<typeof getAllPlatformLabels>> = [];
  try {
    labels = await getAllPlatformLabels();
  } catch {
    /* قاعدة البيانات غير متصلة */
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboardNav.labels", "Platform labels")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.labelsSettingsDescription",
          "Rename recurring platform words (lesson, student, course, quiz...) in Arabic and English. Changes apply across the whole platform.",
        )}
      </p>
      <LabelsSettingsForm initialLabels={labels} />
    </div>
  );
}
