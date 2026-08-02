import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createMessage,
  getOrCreateConversation,
  getStaffForStudentMessaging,
} from "@/lib/db";
import { getConsultationById } from "@/lib/lms-features-db";
import { createNotification } from "@/lib/lms-spec-db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "يجب تسجيل الدخول لحجز استشارة" }, { status: 401 });
  }

  const { id } = await params;
  const offer = await getConsultationById(id).catch(() => null);
  if (!offer || !offer.isPublished) {
    return NextResponse.json({ error: "الاستشارة غير متاحة" }, { status: 404 });
  }

  const staff = await getStaffForStudentMessaging();
  const admin = staff.find((s) => s.role === "ADMIN") ?? staff[0];
  if (!admin) {
    return NextResponse.json({ error: "لا يوجد مسؤول لاستقبال طلب الحجز حالياً" }, { status: 503 });
  }

  try {
    const conversation = await getOrCreateConversation(admin.id, session.user.id);
    const title = offer.titleAr?.trim() || offer.title;
    const studentName = session.user.name?.trim() || "طالب";
    const content = [
      `طلب حجز استشارة جديد`,
      `الاستشارة: ${title}`,
      offer.price > 0 ? `السعر: ${offer.price} ج.م` : null,
      `من: ${studentName}`,
      `رابط العرض: /consultations/${offer.id}`,
    ]
      .filter(Boolean)
      .join("\n");

    await createMessage({
      conversation_id: conversation.id,
      sender_id: session.user.id,
      message_type: "text",
      content,
    });

    try {
      await createNotification({
        userId: admin.id,
        type: "message",
        title: "طلب حجز استشارة",
        body: `${studentName} طلب حجز: ${title}`.slice(0, 180),
        link: `/dashboard/messages?c=${encodeURIComponent(conversation.id)}`,
      });
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
    });
  } catch (e) {
    console.error("POST /api/consultations/[id]/book", e);
    return NextResponse.json({ error: "فشل إنشاء طلب الحجز" }, { status: 500 });
  }
}
