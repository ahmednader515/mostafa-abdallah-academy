import { sql } from "@/lib/db";

function generateId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return value ? String(value) : "";
}

export function parseUserAgent(ua: string | null | undefined): { deviceType: string; browser: string } {
  const s = (ua ?? "").trim();
  if (!s) return { deviceType: "unknown", browser: "unknown" };

  let deviceType = "desktop";
  if (/iPad|Tablet/i.test(s)) deviceType = "tablet";
  else if (/Mobi|Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(s)) deviceType = "mobile";

  let browser = "other";
  if (/Edg\//i.test(s)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(s)) browser = "Opera";
  else if (/Chrome\//i.test(s) && !/Edg\//i.test(s)) browser = "Chrome";
  else if (/Firefox\//i.test(s)) browser = "Firefox";
  else if (/Safari\//i.test(s) && !/Chrome\//i.test(s)) browser = "Safari";
  else if (/MSIE|Trident\//i.test(s)) browser = "IE";

  return { deviceType, browser };
}

export function getClientIpFromHeaders(headers: Headers | { get(name: string): string | null }): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return null;
}

export async function ensureAdminSecuritySchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS "UserLoginLog" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  try {
    await sql`ALTER TABLE "UserLoginLog" ADD COLUMN IF NOT EXISTS session_id TEXT`;
    await sql`ALTER TABLE "UserLoginLog" ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success'`;
    await sql`ALTER TABLE "UserLoginLog" ADD COLUMN IF NOT EXISTS failure_reason TEXT`;
    await sql`ALTER TABLE "UserLoginLog" ADD COLUMN IF NOT EXISTS logged_in_at TIMESTAMPTZ`;
    await sql`ALTER TABLE "UserLoginLog" ADD COLUMN IF NOT EXISTS logged_out_at TIMESTAMPTZ`;
    await sql`ALTER TABLE "UserLoginLog" ADD COLUMN IF NOT EXISTS session_duration_seconds INT`;
    await sql`ALTER TABLE "UserLoginLog" ADD COLUMN IF NOT EXISTS last_action TEXT`;
    await sql`ALTER TABLE "UserLoginLog" ADD COLUMN IF NOT EXISTS device_type TEXT`;
    await sql`ALTER TABLE "UserLoginLog" ADD COLUMN IF NOT EXISTS browser TEXT`;
    await sql`UPDATE "UserLoginLog" SET logged_in_at = created_at WHERE logged_in_at IS NULL`;
  } catch {
    /* ignore */
  }

  await sql`CREATE INDEX IF NOT EXISTS "UserLoginLog_user_idx" ON "UserLoginLog"(user_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS "UserLoginLog_created_idx" ON "UserLoginLog"(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS "UserLoginLog_session_idx" ON "UserLoginLog"(session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS "UserLoginLog_status_idx" ON "UserLoginLog"(status, created_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_email TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  try {
    await sql`ALTER TABLE "AdminAuditLog" ADD COLUMN IF NOT EXISTS ip TEXT`;
    await sql`ALTER TABLE "AdminAuditLog" ADD COLUMN IF NOT EXISTS user_agent TEXT`;
    await sql`ALTER TABLE "AdminAuditLog" ADD COLUMN IF NOT EXISTS method TEXT`;
    await sql`ALTER TABLE "AdminAuditLog" ADD COLUMN IF NOT EXISTS path TEXT`;
  } catch {
    /* ignore */
  }
  await sql`CREATE INDEX IF NOT EXISTS "AdminAuditLog_created_idx" ON "AdminAuditLog"(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS "AdminAuditLog_actor_idx" ON "AdminAuditLog"(actor_id, created_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS "PlatformSecuritySetting" (
      id TEXT PRIMARY KEY DEFAULT 'default',
      idle_timeout_minutes INT NOT NULL DEFAULT 60,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    INSERT INTO "PlatformSecuritySetting" (id, idle_timeout_minutes)
    VALUES ('default', 60)
    ON CONFLICT (id) DO NOTHING
  `;
}

export type UserLoginLogRow = {
  id: string;
  userId: string;
  userName: string | null;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
  sessionId: string | null;
  status: string;
  failureReason: string | null;
  loggedInAt: string;
  loggedOutAt: string | null;
  sessionDurationSeconds: number | null;
  lastAction: string | null;
  deviceType: string | null;
  browser: string | null;
  createdAt: string;
};

function mapLoginRow(r: Record<string, unknown>): UserLoginLogRow {
  const loggedIn =
    r.logged_in_at != null ? toIso(r.logged_in_at) : toIso(r.created_at);
  return {
    id: String(r.id),
    userId: String(r.user_id ?? ""),
    userName: r.user_name ? String(r.user_name) : null,
    email: r.email ? String(r.email) : null,
    ip: r.ip ? String(r.ip) : null,
    userAgent: r.user_agent ? String(r.user_agent) : null,
    sessionId: r.session_id ? String(r.session_id) : null,
    status: r.status ? String(r.status) : "success",
    failureReason: r.failure_reason ? String(r.failure_reason) : null,
    loggedInAt: loggedIn,
    loggedOutAt: r.logged_out_at != null ? toIso(r.logged_out_at) : null,
    sessionDurationSeconds:
      r.session_duration_seconds != null ? Number(r.session_duration_seconds) : null,
    lastAction: r.last_action ? String(r.last_action) : null,
    deviceType: r.device_type ? String(r.device_type) : null,
    browser: r.browser ? String(r.browser) : null,
    createdAt: toIso(r.created_at),
  };
}

export async function recordUserLogin(data: {
  userId: string;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
}): Promise<string> {
  await ensureAdminSecuritySchema();
  const id = generateId("ull");
  const { deviceType, browser } = parseUserAgent(data.userAgent);
  await sql`
    INSERT INTO "UserLoginLog" (
      id, user_id, email, ip, user_agent, session_id, status,
      logged_in_at, device_type, browser
    )
    VALUES (
      ${id}, ${data.userId}, ${data.email ?? null}, ${data.ip ?? null},
      ${data.userAgent ?? null}, ${data.sessionId ?? null}, 'success',
      NOW(), ${deviceType}, ${browser}
    )
  `;
  return id;
}

export async function recordFailedLogin(data: {
  email?: string | null;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  reason?: string | null;
}): Promise<void> {
  await ensureAdminSecuritySchema();
  const id = generateId("ull");
  const { deviceType, browser } = parseUserAgent(data.userAgent);
  const userId = data.userId?.trim() || "anonymous";
  await sql`
    INSERT INTO "UserLoginLog" (
      id, user_id, email, ip, user_agent, status, failure_reason,
      logged_in_at, device_type, browser
    )
    VALUES (
      ${id}, ${userId}, ${data.email ?? null}, ${data.ip ?? null},
      ${data.userAgent ?? null}, 'failed', ${data.reason ?? null},
      NOW(), ${deviceType}, ${browser}
    )
  `;
}

export async function closeUserLoginSession(data: {
  userId: string;
  sessionId?: string | null;
  lastAction?: string | null;
}): Promise<void> {
  await ensureAdminSecuritySchema();
  const sessionId = data.sessionId?.trim() || null;

  const openRows = sessionId
    ? await sql`
        SELECT id, logged_in_at, created_at
        FROM "UserLoginLog"
        WHERE user_id = ${data.userId}
          AND session_id = ${sessionId}
          AND status = 'success'
          AND logged_out_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `
    : await sql`
        SELECT id, logged_in_at, created_at
        FROM "UserLoginLog"
        WHERE user_id = ${data.userId}
          AND status = 'success'
          AND logged_out_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `;

  const row = openRows[0] as
    | { id: string; logged_in_at?: Date | string | null; created_at?: Date | string }
    | undefined;
  if (!row) return;

  const startRaw = row.logged_in_at ?? row.created_at;
  const startMs = startRaw ? new Date(startRaw).getTime() : Date.now();
  const durationSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  const lastAction = data.lastAction?.trim() || null;

  await sql`
    UPDATE "UserLoginLog"
    SET
      logged_out_at = NOW(),
      session_duration_seconds = ${durationSec},
      last_action = COALESCE(${lastAction}, last_action)
    WHERE id = ${row.id}
  `;
}

export async function touchLoginLastAction(userId: string, action: string): Promise<void> {
  await ensureAdminSecuritySchema();
  const label = action.trim().slice(0, 500);
  if (!label) return;
  await sql`
    UPDATE "UserLoginLog"
    SET last_action = ${label}
    WHERE id = (
      SELECT id FROM "UserLoginLog"
      WHERE user_id = ${userId}
        AND status = 'success'
        AND logged_out_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    )
  `;
}

export async function recordAdminAudit(data: {
  actorId: string;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  method?: string | null;
  path?: string | null;
}) {
  await ensureAdminSecuritySchema();
  const id = generateId("aal");
  await sql`
    INSERT INTO "AdminAuditLog" (
      id, actor_id, actor_email, action, target_type, target_id, details,
      ip, user_agent, method, path
    )
    VALUES (
      ${id}, ${data.actorId}, ${data.actorEmail ?? null}, ${data.action},
      ${data.targetType ?? null}, ${data.targetId ?? null}, ${data.details ?? null},
      ${data.ip ?? null}, ${data.userAgent ?? null}, ${data.method ?? null}, ${data.path ?? null}
    )
  `;
  try {
    await touchLoginLastAction(data.actorId, data.action);
  } catch {
    /* ignore */
  }
}

export type LoginLogListParams = {
  search?: string;
  userId?: string;
  status?: "success" | "failed" | "all";
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export async function listUserLoginLogs(
  limitOrParams: number | LoginLogListParams = 100,
  offsetArg = 0,
): Promise<UserLoginLogRow[]> {
  await ensureAdminSecuritySchema();

  const params: LoginLogListParams =
    typeof limitOrParams === "number"
      ? { limit: limitOrParams, offset: offsetArg }
      : limitOrParams;

  const limit = Math.min(500, Math.max(1, Number(params.limit ?? 100)));
  const offset = Math.max(0, Number(params.offset ?? 0));
  const search = params.search?.trim() || "";
  const userId = params.userId?.trim() || "";
  const status =
    params.status === "success" || params.status === "failed" ? params.status : null;
  const from = params.from?.trim() || "";
  const to = params.to?.trim() || "";
  const searchLike = search ? `%${search}%` : null;

  const rows = await sql`
    SELECT l.*, u.name AS user_name
    FROM "UserLoginLog" l
    LEFT JOIN "User" u ON u.id = l.user_id
    WHERE
      (${userId} = '' OR l.user_id = ${userId})
      AND (${status}::text IS NULL OR l.status = ${status})
      AND (
        ${searchLike}::text IS NULL
        OR l.email ILIKE ${searchLike}
        OR u.name ILIKE ${searchLike}
        OR l.ip ILIKE ${searchLike}
      )
      AND (${from} = '' OR COALESCE(l.logged_in_at, l.created_at) >= ${from}::timestamptz)
      AND (${to} = '' OR COALESCE(l.logged_in_at, l.created_at) <= ${to}::timestamptz)
    ORDER BY COALESCE(l.logged_in_at, l.created_at) DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return (rows as Record<string, unknown>[]).map(mapLoginRow);
}

export async function countUserLoginLogs(params: LoginLogListParams = {}): Promise<number> {
  await ensureAdminSecuritySchema();
  const search = params.search?.trim() || "";
  const userId = params.userId?.trim() || "";
  const status =
    params.status === "success" || params.status === "failed" ? params.status : null;
  const from = params.from?.trim() || "";
  const to = params.to?.trim() || "";
  const searchLike = search ? `%${search}%` : null;

  const rows = await sql`
    SELECT COUNT(*)::int AS n
    FROM "UserLoginLog" l
    LEFT JOIN "User" u ON u.id = l.user_id
    WHERE
      (${userId} = '' OR l.user_id = ${userId})
      AND (${status}::text IS NULL OR l.status = ${status})
      AND (
        ${searchLike}::text IS NULL
        OR l.email ILIKE ${searchLike}
        OR u.name ILIKE ${searchLike}
        OR l.ip ILIKE ${searchLike}
      )
      AND (${from} = '' OR COALESCE(l.logged_in_at, l.created_at) >= ${from}::timestamptz)
      AND (${to} = '' OR COALESCE(l.logged_in_at, l.created_at) <= ${to}::timestamptz)
  `;
  return Number((rows[0] as { n?: number })?.n ?? 0);
}

export type AdminAuditLogRow = {
  id: string;
  actorId: string;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ip: string | null;
  userAgent: string | null;
  method: string | null;
  path: string | null;
  createdAt: string;
};

export type AuditLogListParams = {
  search?: string;
  actor?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

function mapAuditRow(r: Record<string, unknown>): AdminAuditLogRow {
  return {
    id: String(r.id),
    actorId: String(r.actor_id),
    actorEmail: r.actor_email ? String(r.actor_email) : null,
    action: String(r.action),
    targetType: r.target_type ? String(r.target_type) : null,
    targetId: r.target_id ? String(r.target_id) : null,
    details: r.details ? String(r.details) : null,
    ip: r.ip ? String(r.ip) : null,
    userAgent: r.user_agent ? String(r.user_agent) : null,
    method: r.method ? String(r.method) : null,
    path: r.path ? String(r.path) : null,
    createdAt: toIso(r.created_at),
  };
}

export async function listAdminAuditLogs(
  limitOrParams: number | AuditLogListParams = 100,
  offsetArg = 0,
): Promise<AdminAuditLogRow[]> {
  await ensureAdminSecuritySchema();

  const params: AuditLogListParams =
    typeof limitOrParams === "number"
      ? { limit: limitOrParams, offset: offsetArg }
      : limitOrParams;

  const limit = Math.min(500, Math.max(1, Number(params.limit ?? 100)));
  const offset = Math.max(0, Number(params.offset ?? 0));
  const search = params.search?.trim() || "";
  const actor = params.actor?.trim() || "";
  const from = params.from?.trim() || "";
  const to = params.to?.trim() || "";
  const searchLike = search ? `%${search}%` : null;
  const actorLike = actor ? `%${actor}%` : null;

  const rows = await sql`
    SELECT *
    FROM "AdminAuditLog"
    WHERE
      (
        ${actorLike}::text IS NULL
        OR actor_email ILIKE ${actorLike}
        OR actor_id ILIKE ${actorLike}
      )
      AND (
        ${searchLike}::text IS NULL
        OR action ILIKE ${searchLike}
        OR details ILIKE ${searchLike}
        OR path ILIKE ${searchLike}
        OR target_type ILIKE ${searchLike}
        OR target_id ILIKE ${searchLike}
      )
      AND (${from} = '' OR created_at >= ${from}::timestamptz)
      AND (${to} = '' OR created_at <= ${to}::timestamptz)
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return (rows as Record<string, unknown>[]).map(mapAuditRow);
}

export async function getIdleTimeoutMinutes(): Promise<number> {
  await ensureAdminSecuritySchema();
  const rows = await sql`SELECT idle_timeout_minutes FROM "PlatformSecuritySetting" WHERE id = 'default' LIMIT 1`;
  return Math.max(5, Number((rows[0] as { idle_timeout_minutes?: number })?.idle_timeout_minutes ?? 60));
}

export async function setIdleTimeoutMinutes(minutes: number): Promise<void> {
  await ensureAdminSecuritySchema();
  const m = Math.max(5, Math.min(24 * 60, Math.floor(minutes)));
  await sql`
    UPDATE "PlatformSecuritySetting" SET idle_timeout_minutes = ${m}, updated_at = NOW() WHERE id = 'default'
  `;
}
