import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateSocialLink, deleteSocialLink } from "@/lib/lms-spec-db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
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
  try {
    await updateSocialLink(id, body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل تحديث الرابط" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteSocialLink(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حذف الرابط" }, { status: 500 });
  }
}
