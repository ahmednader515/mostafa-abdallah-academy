import { NextRequest, NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { UserRole } from "@/lib/types";
import {
  getClientIpFromHeaders,
  recordAdminAudit,
} from "@/lib/admin-security-db";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isStaffRole(role: string | undefined | null): boolean {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN";
}

export function actionFromMethodAndPath(method: string, path: string): string {
  const clean = path.replace(/^\/api\/dashboard\/?/, "").replace(/\/+$/, "") || "dashboard";
  const segments = clean.split("/").filter(Boolean);
  const resource = segments[0] || "dashboard";
  const verb =
    method === "POST"
      ? "create"
      : method === "DELETE"
        ? "delete"
        : method === "PUT" || method === "PATCH"
          ? "update"
          : method.toLowerCase();
  return `${verb}_${resource}`.slice(0, 120);
}

export function extractTargetFromPath(path: string): { targetType: string | null; targetId: string | null } {
  const clean = path.replace(/^\/api\/dashboard\/?/, "");
  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return { targetType: null, targetId: null };
  const targetType = segments[0] ?? null;
  const maybeId = segments[1];
  const targetId =
    maybeId && !["reorder", "export", "targets", "homepage-featured", "broadcast"].includes(maybeId)
      ? maybeId
      : null;
  return { targetType, targetId };
}

export async function auditDashboardMutation(
  request: Request | NextRequest,
  session: Session,
  overrides?: { action?: string; details?: string | null },
): Promise<void> {
  const role = session.user?.role as UserRole | undefined;
  if (!isStaffRole(role)) return;
  const method = request.method.toUpperCase();
  if (!MUTATION_METHODS.has(method)) return;

  const url = new URL(request.url);
  const path = url.pathname;
  // avoid recursive/noisy self-logging
  if (path.startsWith("/api/internal/") || path.includes("/settings/login-log")) return;
  if (path.endsWith("/settings/security") && method === "GET") return;

  const headers = request.headers;
  const ip = getClientIpFromHeaders(headers);
  const userAgent = headers.get("user-agent");
  const { targetType, targetId } = extractTargetFromPath(path);
  const action = overrides?.action ?? actionFromMethodAndPath(method, path);

  await recordAdminAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action,
    targetType,
    targetId,
    details: overrides?.details ?? null,
    ip,
    userAgent,
    method,
    path,
  });
}

export type StaffAuthResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

/** Staff gate + automatic audit for mutating dashboard API requests. */
export async function requireStaffAndAudit(
  request: Request | NextRequest,
  opts?: { adminOnly?: boolean },
): Promise<StaffAuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "غير مصرح" }, { status: 403 }),
    };
  }
  if (opts?.adminOnly && session.user.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ error: "غير مصرح" }, { status: 403 }),
    };
  }
  if (MUTATION_METHODS.has(request.method.toUpperCase())) {
    void auditDashboardMutation(request, session).catch(() => undefined);
  }
  return { ok: true, session };
}
