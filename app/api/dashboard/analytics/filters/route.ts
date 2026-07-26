import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireStaffPermission } from "@/lib/require-permission";
import { getAnalyticsFilterOptions } from "@/lib/analytics-db";

export async function GET() {
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
  const options = await getAnalyticsFilterOptions();
  return NextResponse.json(options);
}
