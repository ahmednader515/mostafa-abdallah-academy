import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listPaymentMethods, createPaymentMethod } from "@/lib/lms-spec-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const methods = await listPaymentMethods();
    return NextResponse.json({ methods });
  } catch {
    return NextResponse.json({ error: "فشل جلب وسائل الدفع" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
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
  if (!body.type?.trim() || !body.name?.trim()) {
    return NextResponse.json({ error: "النوع والاسم مطلوبان" }, { status: 400 });
  }
  try {
    const created = await createPaymentMethod({
      type: body.type,
      name: body.name,
      nameAr: body.nameAr ?? null,
      accountDetails: body.accountDetails ?? null,
      instructions: body.instructions ?? null,
      instructionsEn: body.instructionsEn ?? null,
      configJson: body.configJson ?? null,
      isEnabled: body.isEnabled,
      order: body.order,
    });
    return NextResponse.json({ success: true, id: created.id });
  } catch {
    return NextResponse.json({ error: "فشل إنشاء وسيلة الدفع" }, { status: 500 });
  }
}
