import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJobsHeroImageUrl, setJobsHeroImageUrl } from "@/lib/db";
import { requireStaffPermission } from "@/lib/require-permission";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const gate = await requireStaffPermission(session.user.id, session.user.role, "canPostJobs");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const url = await getJobsHeroImageUrl();
  return NextResponse.json({ url });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const gate = await requireStaffPermission(session.user.id, session.user.role, "canPostJobs");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  let body: { url?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  try {
    const url = await setJobsHeroImageUrl(body.url ?? null);
    return NextResponse.json({ success: true, url });
  } catch (e) {
    console.error("jobs-hero PATCH", e);
    return NextResponse.json({ error: "تعذر حفظ صورة القسم" }, { status: 500 });
  }
}
