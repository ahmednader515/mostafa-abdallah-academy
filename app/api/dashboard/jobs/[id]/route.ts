import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteJob, getJobById, reorderJobs, updateJob } from "@/lib/db";
import { permissionDeniedResponse } from "@/lib/require-permission";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const denied = await permissionDeniedResponse(session.user.id, session.user.role, "canPostJobs");
  if (denied) return denied;
  const { id } = await params;
  try {
    const job = await getJobById(id);
    if (!job) return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: "فشل جلب الوظيفة" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const denied = await permissionDeniedResponse(session.user.id, session.user.role, "canPostJobs");
  if (denied) return denied;
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  try {
    if (body.reorder === "up" || body.reorder === "down") {
      await reorderJobs(id, body.reorder);
      return NextResponse.json({ success: true });
    }

    const phones = Array.isArray(body.phones)
      ? body.phones.map((p) => String(p ?? "").trim()).filter(Boolean)
      : undefined;
    const skills = Array.isArray(body.skills)
      ? body.skills.map((s) => String(s ?? "").trim()).filter(Boolean)
      : typeof body.skills === "string"
        ? String(body.skills)
            .split(/[,،\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    await updateJob(id, {
      title: body.title !== undefined ? String(body.title) : undefined,
      title_ar: body.titleAr !== undefined ? (body.titleAr as string | null) : undefined,
      description: body.description !== undefined ? String(body.description) : undefined,
      description_ar:
        body.descriptionAr !== undefined ? (body.descriptionAr as string | null) : undefined,
      location: body.location !== undefined ? (body.location as string | null) : undefined,
      job_type: body.jobType !== undefined ? (body.jobType as string | null) : undefined,
      image_url: body.imageUrl !== undefined ? (body.imageUrl as string | null) : undefined,
      email: body.email !== undefined ? (body.email as string | null) : undefined,
      phones,
      whatsapp: body.whatsapp !== undefined ? (body.whatsapp as string | null) : undefined,
      category_id: body.categoryId !== undefined ? (body.categoryId as string | null) : undefined,
      company_name: body.companyName !== undefined ? (body.companyName as string | null) : undefined,
      salary_min:
        body.salaryMin !== undefined
          ? body.salaryMin === null || body.salaryMin === ""
            ? null
            : Number(body.salaryMin)
          : undefined,
      salary_max:
        body.salaryMax !== undefined
          ? body.salaryMax === null || body.salaryMax === ""
            ? null
            : Number(body.salaryMax)
          : undefined,
      salary_label: body.salaryLabel !== undefined ? (body.salaryLabel as string | null) : undefined,
      experience_label:
        body.experienceLabel !== undefined ? (body.experienceLabel as string | null) : undefined,
      skills,
      badge: body.badge !== undefined ? (body.badge as string | null) : undefined,
      show_phone: body.showPhone !== undefined ? !!body.showPhone : undefined,
      show_email: body.showEmail !== undefined ? !!body.showEmail : undefined,
      contact_order:
        body.contactOrder !== undefined
          ? body.contactOrder === "email_first"
            ? "email_first"
            : "phone_first"
          : undefined,
      is_published: body.isPublished !== undefined ? !!body.isPublished : undefined,
      order: body.order !== undefined ? Number(body.order) : undefined,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PUT /api/dashboard/jobs/[id]", e);
    return NextResponse.json({ error: "فشل تحديث الوظيفة" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const denied = await permissionDeniedResponse(session.user.id, session.user.role, "canPostJobs");
  if (denied) return denied;
  const { id } = await params;
  try {
    await deleteJob(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حذف الوظيفة" }, { status: 500 });
  }
}
