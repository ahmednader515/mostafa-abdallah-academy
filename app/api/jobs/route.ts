import { NextResponse } from "next/server";
import { listPublishedJobs } from "@/lib/db";

export async function GET() {
  try {
    const jobs = await listPublishedJobs();
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "فشل جلب الوظائف" }, { status: 500 });
  }
}
