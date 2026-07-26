import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createJob, listAllJobs } from "@/lib/db";
import { requireStaffPermission } from "@/lib/require-permission";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const gate = await requireStaffPermission(session.user.id, session.user.role, "canPostJobs");
  if (!gate.ok && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const jobs = await listAllJobs();
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "فشل جلب الوظائف" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  if (session.user.role !== "ADMIN") {
    const gate = await requireStaffPermission(session.user.id, session.user.role, "canPostJobs");
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  let body: {
    title?: string;
    titleAr?: string | null;
    description?: string;
    descriptionAr?: string | null;
    location?: string | null;
    jobType?: string | null;
    imageUrl?: string | null;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    isPublished?: boolean;
    order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "عنوان الوظيفة مطلوب" }, { status: 400 });
  try {
    const out = await createJob({
      title,
      title_ar: body.titleAr ?? null,
      description: String(body.description ?? ""),
      description_ar: body.descriptionAr ?? null,
      location: body.location ?? null,
      job_type: body.jobType ?? null,
      image_url: body.imageUrl ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      whatsapp: body.whatsapp ?? null,
      is_published: body.isPublished === true,
      order: body.order,
    });
    return NextResponse.json({ success: true, id: out.id });
  } catch {
    return NextResponse.json({ error: "فشل إنشاء الوظيفة" }, { status: 500 });
  }
}
