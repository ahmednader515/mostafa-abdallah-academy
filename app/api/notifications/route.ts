import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/lms-spec-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotificationsForUser(session.user.id),
      getUnreadNotificationCount(session.user.id),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ error: "فشل جلب الإشعارات" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  let body: { all?: boolean; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  try {
    if (body.all) {
      await markAllNotificationsRead(session.user.id);
    } else if (body.id) {
      await markNotificationRead(body.id);
    } else {
      return NextResponse.json({ error: "يجب تحديد all أو id" }, { status: 400 });
    }
    const unreadCount = await getUnreadNotificationCount(session.user.id);
    return NextResponse.json({ success: true, unreadCount });
  } catch {
    return NextResponse.json({ error: "فشل تحديث الإشعارات" }, { status: 500 });
  }
}
