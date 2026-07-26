import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEnrollmentsWithCourseByUserId,
  getUsersByRole,
  listUserPlatformSubscriptionsForAdmin,
} from "@/lib/db";
import { ensureUserExtraColumns } from "@/lib/dashboard-overview";

function csv(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  await ensureUserExtraColumns().catch(() => undefined);
  const students = await getUsersByRole("STUDENT");
  const subscriptions = await listUserPlatformSubscriptionsForAdmin();
  const subscriptionsByStudent = new Map<string, string[]>();
  for (const subscription of subscriptions) {
    const current = subscriptionsByStudent.get(subscription.userId) ?? [];
    current.push(
      `${subscription.planName ?? "Subscription"} (${subscription.isActive ? "active" : "expired"})`,
    );
    subscriptionsByStudent.set(subscription.userId, current);
  }
  const lines = [
    "name,email,phone,courses,subscriptions,status,registered_at,last_login,activity",
  ];
  for (const student of students) {
    const row = student as unknown as Record<string, unknown>;
    const enrollments = await getEnrollmentsWithCourseByUserId(student.id).catch(() => []);
    const courses = enrollments.map((e) => e.course.titleAr || e.course.title).join(" | ");
    const phone = student.student_number || student.guardian_number || "";
    const suspended = Boolean(row.is_suspended);
    const status = suspended ? "suspended" : "active";
    const registered =
      student.created_at instanceof Date
        ? student.created_at.toISOString()
        : String(student.created_at ?? "");
    const lastLogin = row.last_login_at
      ? row.last_login_at instanceof Date
        ? row.last_login_at.toISOString()
        : String(row.last_login_at)
      : "";
    const activity = enrollments.length
      ? lastLogin
        ? "active"
        : "enrolled"
      : "inactive";
    lines.push(
      [
        student.name,
        student.email,
        phone,
        courses,
        (subscriptionsByStudent.get(student.id) ?? []).join(" | "),
        status,
        registered,
        lastLogin,
        activity,
      ]
        .map(csv)
        .join(","),
    );
  }
  return new NextResponse(`\uFEFF${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="students.csv"',
      "Cache-Control": "no-store",
    },
  });
}
