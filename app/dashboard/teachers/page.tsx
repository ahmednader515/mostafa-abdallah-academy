import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { ensureTeacherHomepageOrderColumn, getTeachersFeatureEnabled, getUsersByRole } from "@/lib/db";
import { ensureUserExtraColumns } from "@/lib/dashboard-overview";
import { getEffectivePermissions } from "@/lib/lms-features-db";
import { getServerTranslator } from "@/lib/i18n/server";
import { TeachersAdminClient } from "./TeachersAdminClient";

function normalizeTeacherHomepageOrder(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 1 || n > 4) return null;
  return Math.floor(n);
}

export default async function TeachersAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();

  const enabled = await getTeachersFeatureEnabled();
  let raw: Awaited<ReturnType<typeof getUsersByRole>> = [];
  if (enabled) {
    await ensureTeacherHomepageOrderColumn().catch(() => {});
    await ensureUserExtraColumns().catch(() => {});
    raw = await getUsersByRole("TEACHER");
  }
  const initialTeachers = await Promise.all(
    raw.map(async (u) => {
      const permissions = await getEffectivePermissions(u.id, "TEACHER").catch(() => null);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        subject: u.teacher_subject ?? null,
        avatarUrl: u.teacher_avatar_url ?? null,
        phone: u.student_number ?? null,
        homepageOrder: normalizeTeacherHomepageOrder(
          (u as { teacher_homepage_order?: unknown }).teacher_homepage_order,
        ),
        bio: (u as { teacher_bio?: string | null }).teacher_bio ?? null,
        permissions,
      };
    }),
  );

  return (
    <div>
      <Link href="/dashboard" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        {t("dashboard.backToDashboard")}
      </Link>
      <h2 className="mt-4 text-xl font-bold text-[var(--color-foreground)]">{t("dashboard.teachersPage.title")}</h2>
      <TeachersAdminClient initialEnabled={enabled} initialTeachers={initialTeachers} />
    </div>
  );
}
