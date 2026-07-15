import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createJob, listAllJobs } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
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
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: {
    title?: string;
    titleAr?: string | null;
    description?: string;
    descriptionAr?: string | null;
    location?: string | null;
    jobType?: string | null;
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
      is_published: body.isPublished === true,
      order: body.order,
    });
    return NextResponse.json({ success: true, id: out.id });
  } catch {
    return NextResponse.json({ error: "فشل إنشاء الوظيفة" }, { status: 500 });
  }
}
