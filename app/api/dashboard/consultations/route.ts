import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createConsultation, listAllConsultations } from "@/lib/lms-features-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const items = await listAllConsultations();
  return NextResponse.json({ items, offers: items });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const body = await request.json();
  const result = await createConsultation({
    title: String(body.titleEn || body.title || body.titleAr || "Consultation"),
    titleAr: body.titleAr != null ? String(body.titleAr) : null,
    description: String(body.descriptionEn || body.description || ""),
    descriptionAr: body.descriptionAr != null ? String(body.descriptionAr) : null,
    imageUrl: body.imageUrl || null,
    scheduleText: body.scheduledAt || body.scheduleText || null,
    scheduleTextAr: body.scheduleTextAr != null ? String(body.scheduleTextAr) : null,
    price: Number(body.price) || 0,
    isPublished: true,
  });
  return NextResponse.json(result);
}
