import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getStudentDashboardFlags,
  listStudentLoginDevices,
} from "@/lib/student-dashboard";
import { getServerTranslator } from "@/lib/i18n/server";
import { StudentAccountSettingsClient } from "./StudentAccountSettingsClient";

export default async function StudentAccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  const flags = await getStudentDashboardFlags();
  if (!flags.settings) redirect("/dashboard");

  const [t, devices] = await Promise.all([
    getServerTranslator(),
    listStudentLoginDevices(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t("studentDash.nav.settings", "Settings")}</h2>
      <StudentAccountSettingsClient devices={devices} />
    </div>
  );
}
