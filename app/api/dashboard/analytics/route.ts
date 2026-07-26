import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireStaffPermission } from "@/lib/require-permission";
import {
  getAnalyticsDashboard,
  resolveAnalyticsRange,
  type AnalyticsSource,
  type AnalyticsStatus,
} from "@/lib/analytics-db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const gate = await requireStaffPermission(
    session.user.id,
    session.user.role,
    "canViewAnalytics",
  );
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const sp = request.nextUrl.searchParams;
  const range = resolveAnalyticsRange({
    preset: sp.get("preset"),
    from: sp.get("from"),
    to: sp.get("to"),
  });

  const data = await getAnalyticsDashboard({
    ...range,
    planId: sp.get("planId") || undefined,
    courseId: sp.get("courseId") || undefined,
    categoryId: sp.get("categoryId") || undefined,
    teacherId: sp.get("teacherId") || undefined,
    userId: sp.get("userId") || undefined,
    source: (sp.get("source") as AnalyticsSource) || undefined,
    status: (sp.get("status") as AnalyticsStatus) || undefined,
    country: sp.get("country") || undefined,
  });

  return NextResponse.json(data);
}
