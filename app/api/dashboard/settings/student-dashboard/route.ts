import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getStudentDashboardFlags,
  updateStudentDashboardFlags,
} from "@/lib/student-dashboard";
import {
  DEFAULT_STUDENT_DASHBOARD_FLAGS,
  STUDENT_DASHBOARD_SECTION_KEYS,
  type StudentDashboardFlags,
} from "@/lib/student-dashboard-flags";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const flags = await getStudentDashboardFlags();
  return NextResponse.json({ flags });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: { flags?: Partial<StudentDashboardFlags> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const next = { ...DEFAULT_STUDENT_DASHBOARD_FLAGS };
  for (const key of STUDENT_DASHBOARD_SECTION_KEYS) {
    if (typeof body.flags?.[key] === "boolean") next[key] = body.flags[key]!;
  }
  await updateStudentDashboardFlags(next);
  return NextResponse.json({ flags: next });
}
