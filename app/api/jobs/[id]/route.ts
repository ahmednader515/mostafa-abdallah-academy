import { NextResponse } from "next/server";
import { getJobById } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const job = await getJobById(id);
    if (!job || !job.isPublished) {
      return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: "فشل جلب الوظيفة" }, { status: 500 });
  }
}
