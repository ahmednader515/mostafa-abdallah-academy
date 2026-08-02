import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { clearCurrentSessionId } from "@/lib/db";
import {
  closeUserLoginSession,
  getClientIpFromHeaders,
  recordAdminAudit,
} from "@/lib/admin-security-db";

/** مسح جلسة المستخدم الحالية من قاعدة البيانات عند تسجيل الخروج */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: true });
  }

  const userId = (session.user as { id: string }).id;
  const role = session.user.role;
  const email = session.user.email ?? null;

  try {
    const secret =
      process.env.NEXTAUTH_SECRET?.trim() ||
      process.env.AUTH_SECRET?.trim() ||
      (process.env.NODE_ENV !== "production"
        ? "local-dev-only-nextauth-secret-not-for-production"
        : undefined);
    const token = await getToken({ req: request, secret });
    const sessionId =
      typeof token?.sessionId === "string" ? token.sessionId : null;

    let reason: string | null = null;
    try {
      const body = await request.json();
      if (body && typeof body.reason === "string") reason = body.reason;
    } catch {
      /* no body */
    }

    const lastAction = reason ? `logout:${reason}` : "logout";
    await closeUserLoginSession({ userId, sessionId, lastAction }).catch(() => undefined);

    if (role === "ADMIN" || role === "ASSISTANT_ADMIN") {
      await recordAdminAudit({
        actorId: userId,
        actorEmail: email,
        action: "logout",
        details: reason,
        ip: getClientIpFromHeaders(request.headers),
        userAgent: request.headers.get("user-agent"),
        method: "POST",
        path: "/api/auth/clear-session",
      }).catch(() => undefined);
    }

    await clearCurrentSessionId(userId);
    return NextResponse.json({ ok: true });
  } catch {
    try {
      await clearCurrentSessionId(userId);
    } catch {
      /* ignore */
    }
    return NextResponse.json({ ok: true });
  }
}
