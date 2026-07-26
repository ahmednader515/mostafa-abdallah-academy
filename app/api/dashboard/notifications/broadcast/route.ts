import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/lms-spec-db";
import { getUsersByRole, sql } from "@/lib/db";
import { recordAdminAudit } from "@/lib/admin-security-db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: {
    title?: string;
    body?: string;
    imageUrl?: string | null;
    target?: "all_students" | "course" | "user";
    courseId?: string;
    userId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const title = String(body.title ?? "").trim();
  const content = String(body.body ?? "").trim();
  if (!title) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });

  let userIds: string[] = [];
  if (body.target === "user" && body.userId) {
    userIds = [body.userId.trim()];
  } else if (body.target === "course" && body.courseId) {
    const rows = await sql`
      SELECT DISTINCT user_id FROM "Enrollment" WHERE course_id = ${body.courseId.trim()}
    `;
    userIds = (rows as { user_id: string }[]).map((r) => String(r.user_id));
  } else {
    const students = await getUsersByRole("STUDENT");
    userIds = students.map((s) => s.id);
  }

  const link = body.imageUrl?.trim() || null;
  const notifBody = content + (link ? `\n${link}` : "");
  let sent = 0;
  for (const uid of userIds) {
    await createNotification({
      userId: uid,
      type: "broadcast",
      title,
      body: notifBody || null,
      link: null,
    });
    sent += 1;
  }

  await recordAdminAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "broadcast_notification",
    targetType: body.target ?? "all_students",
    targetId: body.courseId || body.userId || null,
    details: JSON.stringify({ title, sent }),
  }).catch(() => undefined);

  return NextResponse.json({ success: true, sent });
}
