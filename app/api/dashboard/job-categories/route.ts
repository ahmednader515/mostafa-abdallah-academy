import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createJobCategory, listJobCategories } from "@/lib/db";
import { slugifyJobCategory } from "@/lib/jobs-format";
import { requireStaffPermission } from "@/lib/require-permission";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const gate = await requireStaffPermission(session.user.id, session.user.role, "canPostJobs");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const categories = await listJobCategories();
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const gate = await requireStaffPermission(session.user.id, session.user.role, "canPostJobs");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  let body: { name?: string; nameAr?: string | null; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "اسم التصنيف مطلوب" }, { status: 400 });
  const slug = (body.slug?.trim() || slugifyJobCategory(body.nameAr?.trim() || name)).slice(0, 80);
  try {
    const category = await createJobCategory({
      name,
      name_ar: body.nameAr?.trim() || null,
      slug,
    });
    return NextResponse.json({ success: true, category });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل إنشاء التصنيف";
    return NextResponse.json({ error: msg.includes("unique") ? "معرّف التصنيف مستخدم" : msg }, { status: 400 });
  }
}
