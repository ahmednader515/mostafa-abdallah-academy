import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getStudentDashboardFlags } from "@/lib/student-dashboard";
import { getServerTranslator } from "@/lib/i18n/server";
import { StudentNotificationsClient } from "./StudentNotificationsClient";

export default async function StudentNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  const flags = await getStudentDashboardFlags();
  if (!flags.notifications) redirect("/dashboard");
  const t = await getServerTranslator();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t("studentDash.nav.notifications", "Notifications")}</h2>
      <StudentNotificationsClient />
    </div>
  );
}
