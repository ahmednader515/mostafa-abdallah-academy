import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updatePaymentMethod, deletePaymentMethod } from "@/lib/lms-spec-db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  let body: {
    type?: string;
    name?: string;
    nameAr?: string | null;
    accountDetails?: string | null;
    instructions?: string | null;
    instructionsEn?: string | null;
    configJson?: string | null;
    isEnabled?: boolean;
    order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  try {
    await updatePaymentMethod(id, body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل تحديث وسيلة الدفع" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deletePaymentMethod(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حذف وسيلة الدفع" }, { status: 500 });
  }
}
