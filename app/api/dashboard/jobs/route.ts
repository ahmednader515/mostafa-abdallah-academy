import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createJob, listAllJobs, listJobCategories } from "@/lib/db";
import { requireStaffPermission } from "@/lib/require-permission";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const gate = await requireStaffPermission(session.user.id, session.user.role, "canPostJobs");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  try {
    const [jobs, categories] = await Promise.all([listAllJobs(), listJobCategories()]);
    return NextResponse.json({ jobs, categories });
  } catch {
    return NextResponse.json({ error: "فشل جلب الوظائف" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const gate = await requireStaffPermission(session.user.id, session.user.role, "canPostJobs");
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "عنوان الوظيفة مطلوب" }, { status: 400 });

  const phones = Array.isArray(body.phones)
    ? body.phones.map((p) => String(p ?? "").trim()).filter(Boolean)
    : body.phone
      ? [String(body.phone).trim()].filter(Boolean)
      : [];
  const skills = Array.isArray(body.skills)
    ? body.skills.map((s) => String(s ?? "").trim()).filter(Boolean)
    : typeof body.skills === "string"
      ? String(body.skills)
          .split(/[,،\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  try {
    const out = await createJob({
      title,
      title_ar: (body.titleAr as string | null) ?? null,
      description: String(body.description ?? ""),
      description_ar: (body.descriptionAr as string | null) ?? null,
      location: (body.location as string | null) ?? null,
      job_type: (body.jobType as string | null) ?? null,
      image_url: (body.imageUrl as string | null) ?? null,
      email: (body.email as string | null) ?? null,
      phones,
      phone: phones[0] ?? null,
      whatsapp: (body.whatsapp as string | null) ?? null,
      category_id: (body.categoryId as string | null) ?? null,
      company_name: (body.companyName as string | null) ?? null,
      salary_min: body.salaryMin != null && body.salaryMin !== "" ? Number(body.salaryMin) : null,
      salary_max: body.salaryMax != null && body.salaryMax !== "" ? Number(body.salaryMax) : null,
      salary_label: (body.salaryLabel as string | null) ?? null,
      experience_label: (body.experienceLabel as string | null) ?? null,
      skills,
      badge: (body.badge as string | null) ?? null,
      show_phone: body.showPhone !== false,
      show_email: body.showEmail !== false,
      contact_order: body.contactOrder === "email_first" ? "email_first" : "phone_first",
      is_published: body.isPublished === true,
    });
    return NextResponse.json({ success: true, id: out.id });
  } catch (e) {
    console.error("POST /api/dashboard/jobs", e);
    return NextResponse.json({ error: "فشل إنشاء الوظيفة" }, { status: 500 });
  }
}
