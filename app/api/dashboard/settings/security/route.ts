import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getIdleTimeoutMinutes,
  listAdminAuditLogs,
  listUserLoginLogs,
  setIdleTimeoutMinutes,
} from "@/lib/admin-security-db";
import { recordAdminAudit } from "@/lib/admin-security-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const [idleTimeoutMinutes, loginLogs, auditLogs] = await Promise.all([
    getIdleTimeoutMinutes(),
    listUserLoginLogs(80),
    listAdminAuditLogs(80),
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
    }).catch(() => undefined);
  }
  return NextResponse.json({ success: true, idleTimeoutMinutes: await getIdleTimeoutMinutes() });
}
