import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listSocialLinks, createSocialLink } from "@/lib/lms-spec-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const links = await listSocialLinks();
    return NextResponse.json({ links });
  } catch {
    return NextResponse.json({ error: "فشل جلب روابط التواصل" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: {
    network?: string;
    label?: string | null;
    labelEn?: string | null;
    url?: string;
    isEnabled?: boolean;
    order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  if (!body.network?.trim() || !body.url?.trim()) {
    return NextResponse.json({ error: "الشبكة والرابط مطلوبان" }, { status: 400 });
  }
  try {
    const created = await createSocialLink({
      network: body.network.trim(),
      label: body.label ?? null,
      labelEn: body.labelEn ?? null,
      url: body.url.trim(),
      isEnabled: body.isEnabled,
      order: body.order,
    });
    return NextResponse.json({ success: true, id: created.id });
  } catch {
    return NextResponse.json({ error: "فشل إنشاء الرابط" }, { status: 500 });
  }
}
