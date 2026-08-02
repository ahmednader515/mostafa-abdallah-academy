import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { CourseRatingsAdminClient } from "./CourseRatingsAdminClient";

export default async function DashboardCourseRatingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") {
    redirect("/dashboard");
  }

  const t = await getServerTranslator();

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.courseRatings.title", "Course ratings")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.courseRatings.description",
          "Review student course ratings, hide inappropriate comments, or delete them."
        )}
      </p>
      <CourseRatingsAdminClient canDelete={session.user.role === "ADMIN"} />
    </div>
  );
}
