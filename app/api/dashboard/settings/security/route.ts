import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getIdleTimeoutMinutes,
  listAdminAuditLogs,
  listUserLoginLogs,
  setIdleTimeoutMinutes,
  recordAdminAudit,
  getClientIpFromHeaders,
} from "@/lib/admin-security-db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const auditSearch = sp.get("auditSearch") ?? undefined;
  const auditActor = sp.get("auditActor") ?? undefined;
  const auditFrom = sp.get("auditFrom") ?? undefined;
  const auditTo = sp.get("auditTo") ?? undefined;

  const [idleTimeoutMinutes, loginLogs, auditLogs] = await Promise.all([
    getIdleTimeoutMinutes(),
    listUserLoginLogs({ limit: 5 }),
    listAdminAuditLogs({
      search: auditSearch,
      actor: auditActor,
      from: auditFrom,
      to: auditTo,
      limit: 80,
    }),
  ]);
  return NextResponse.json({ idleTimeoutMinutes, loginLogs, auditLogs });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: { idleTimeoutMinutes?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  if (typeof body.idleTimeoutMinutes === "number") {
    await setIdleTimeoutMinutes(body.idleTimeoutMinutes);
    await recordAdminAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "update_idle_timeout",
      details: String(body.idleTimeoutMinutes),
      ip: getClientIpFromHeaders(request.headers),
      userAgent: request.headers.get("user-agent"),
      method: "PATCH",
      path: "/api/dashboard/settings/security",
    }).catch(() => undefined);
  }
  return NextResponse.json({ success: true, idleTimeoutMinutes: await getIdleTimeoutMinutes() });
}
