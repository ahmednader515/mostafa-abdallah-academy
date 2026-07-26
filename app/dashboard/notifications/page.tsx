import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getCoursesPublished, getUsersByRole } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";
import { NotificationsBroadcastClient } from "./NotificationsBroadcastClient";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();
  const [courses, students] = await Promise.all([
    getCoursesPublished(true).catch(() => []),
    getUsersByRole("STUDENT").catch(() => []),
  ]);

  return (
    <div>
      <Link href="/dashboard" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        {t("dashboard.backToDashboard", "Back to dashboard")}
      </Link>
      <h2 className="mt-4 text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.notifications.pageTitle", "Broadcast notifications")}
      </h2>
      <div className="mt-6">
        <NotificationsBroadcastClient
          courses={courses.map((c) => {
            const r = c as unknown as Record<string, unknown>;
            return {
              id: String(r.id),
              title: String(r.titleAr ?? r.title_ar ?? r.title ?? ""),
            };
          })}
          students={students.map((s) => ({ id: s.id, name: s.name, email: s.email }))}
        />
      </div>
    </div>
  );
}
