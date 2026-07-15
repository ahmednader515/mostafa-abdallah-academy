import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteJob, getJobById, reorderJobs, updateJob } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
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
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  let body: {
    title?: string;
    titleAr?: string | null;
    description?: string;
    descriptionAr?: string | null;
    location?: string | null;
    jobType?: string | null;
    isPublished?: boolean;
    order?: number;
    reorder?: "up" | "down";
  };
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
    await updateJob(id, {
      title: body.title,
      title_ar: body.titleAr,
      description: body.description,
      description_ar: body.descriptionAr,
      location: body.location,
      job_type: body.jobType,
      is_published: body.isPublished,
      order: body.order,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل تحديث الوظيفة" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteJob(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حذف الوظيفة" }, { status: 500 });
  }
}
