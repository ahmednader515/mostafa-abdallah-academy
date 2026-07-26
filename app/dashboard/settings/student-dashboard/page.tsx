import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getStudentDashboardFlags } from "@/lib/student-dashboard";
import { getServerTranslator } from "@/lib/i18n/server";
import { StudentDashboardSettingsForm } from "./StudentDashboardSettingsForm";

export default async function StudentDashboardSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  const [t, flags] = await Promise.all([getServerTranslator(), getStudentDashboardFlags()]);

  return (
    <div>
      <h2 className="text-xl font-bold">
        {t("studentDash.adminTitle", "Student dashboard sections")}
      </h2>
      <StudentDashboardSettingsForm initialFlags={flags} />
    </div>
  );
}
