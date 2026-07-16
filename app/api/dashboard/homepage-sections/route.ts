import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomepageSections, upsertHomepageSection, updateHomepageSectionOrder } from "@/lib/lms-spec-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const sections = await getHomepageSections();
    return NextResponse.json({ sections });
  } catch {
    return NextResponse.json({ error: "فشل جلب أقسام الصفحة الرئيسية" }, { status: 500 });
  }
}

type SectionInput = {
  id?: string;
  sectionType: string;
  title?: string | null;
  titleEn?: string | null;
  icon?: string | null;
  configJson?: string | null;
  order?: number;
  isVisible?: boolean;
  isPinned?: boolean;
};

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: { sections?: SectionInput[]; order?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  try {
    if (Array.isArray(body.sections)) {
      for (const s of body.sections) {
        if (!s?.sectionType?.trim()) continue;
        await upsertHomepageSection(s);
      }
    }
    if (Array.isArray(body.order) && body.order.length > 0) {
      await updateHomepageSectionOrder(body.order);
    }
    const sections = await getHomepageSections();
    return NextResponse.json({ success: true, sections });
  } catch {
    return NextResponse.json({ error: "فشل حفظ أقسام الصفحة الرئيسية" }, { status: 500 });
  }
}
