import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  actionFromMethodAndPath,
  extractTargetFromPath,
  isStaffRole,
} from "@/lib/dashboard-audit";
import {
  getClientIpFromHeaders,
  recordAdminAudit,
} from "@/lib/admin-security-db";

/**
 * Internal endpoint invoked from middleware to audit staff mutations on /api/dashboard/*.
 * Authenticated via the caller's session JWT (cookie forwarded by middleware).
 */
export async function POST(request: NextRequest) {
  const secret =
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    (process.env.NODE_ENV !== "production"
      ? "local-dev-only-nextauth-secret-not-for-production"
      : undefined);

  const token = await getToken({ req: request, secret });
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const tokenId = typeof token.id === "string" ? token.id : typeof token.sub === "string" ? token.sub : "";
  if (!tokenId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const role = String(token.role ?? "");
  if (!isStaffRole(role)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let body: { method?: string; path?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const method = String(body.method ?? "").toUpperCase();
  const path = String(body.path ?? "");
  if (!method || !path.startsWith("/api/dashboard")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (path.startsWith("/api/internal/")) {
    return NextResponse.json({ ok: true });
  }

  const actorId = tokenId;
  const actorEmail = typeof token.email === "string" ? token.email : null;
  const { targetType, targetId } = extractTargetFromPath(path);
  const ip = getClientIpFromHeaders(request.headers);
  const userAgent = request.headers.get("user-agent");

  await recordAdminAudit({
    actorId,
    actorEmail,
    action: actionFromMethodAndPath(method, path),
    targetType,
    targetId,
    ip,
    userAgent,
    method,
    path,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
