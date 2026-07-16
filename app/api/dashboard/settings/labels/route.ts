import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllPlatformLabels, upsertPlatformLabelsBulk } from "@/lib/lms-spec-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const labels = await getAllPlatformLabels();
    return NextResponse.json({ labels });
  } catch {
    return NextResponse.json({ error: "فشل جلب المسميات" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: { labels?: { key: string; valueAr: string; valueEn: string; groupName?: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const labels = body.labels;
  if (!Array.isArray(labels) || labels.length === 0) {
    return NextResponse.json({ error: "قائمة المسميات مطلوبة" }, { status: 400 });
  }
  for (const l of labels) {
    if (!l?.key?.trim() || typeof l.valueAr !== "string" || typeof l.valueEn !== "string") {
      return NextResponse.json({ error: "كل مسمى يحتاج مفتاح وقيمة عربية وإنجليزية" }, { status: 400 });
    }
  }
  try {
    await upsertPlatformLabelsBulk(
      labels.map((l) => ({
        key: l.key.trim(),
        valueAr: l.valueAr,
        valueEn: l.valueEn,
        groupName: l.groupName?.trim() || undefined,
      })),
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حفظ المسميات" }, { status: 500 });
  }
}
