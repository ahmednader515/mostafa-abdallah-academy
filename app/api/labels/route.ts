import { NextResponse } from "next/server";
import { getPlatformLabelsMap } from "@/lib/lms-spec-db";

/** خريطة المسميات العامة — متاحة للجميع لعرض المسميات المخصصة (مثال: "متدرب" بدل "طالب") */
export async function GET() {
  try {
    const labels = await getPlatformLabelsMap();
    return NextResponse.json({ labels });
  } catch {
    return NextResponse.json({ labels: {} });
  }
}
