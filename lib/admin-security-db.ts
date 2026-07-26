import { sql } from "@/lib/db";

function generateId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
  await sql`CREATE INDEX IF NOT EXISTS "UserLoginLog_user_idx" ON "UserLoginLog"(user_id, created_at DESC)`;
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
  await sql`CREATE INDEX IF NOT EXISTS "AdminAuditLog_created_idx" ON "AdminAuditLog"(created_at DESC)`;
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

export async function recordUserLogin(data: {
  userId: string;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  await ensureAdminSecuritySchema();
  const id = generateId("ull");
  await sql`
    INSERT INTO "UserLoginLog" (id, user_id, email, ip, user_agent)
    VALUES (${id}, ${data.userId}, ${data.email ?? null}, ${data.ip ?? null}, ${data.userAgent ?? null})
  `;
}

export async function recordAdminAudit(data: {
  actorId: string;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: string | null;
}) {
  await ensureAdminSecuritySchema();
  const id = generateId("aal");
  await sql`
    INSERT INTO "AdminAuditLog" (id, actor_id, actor_email, action, target_type, target_id, details)
    VALUES (
      ${id}, ${data.actorId}, ${data.actorEmail ?? null}, ${data.action},
      ${data.targetType ?? null}, ${data.targetId ?? null}, ${data.details ?? null}
    )
  `;
}

export async function listUserLoginLogs(limit = 100) {
  await ensureAdminSecuritySchema();
  const rows = await sql`
    SELECT l.*, u.name AS user_name
    FROM "UserLoginLog" l
    LEFT JOIN "User" u ON u.id = l.user_id
    ORDER BY l.created_at DESC
    LIMIT ${limit}
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    userName: r.user_name ? String(r.user_name) : null,
    email: r.email ? String(r.email) : null,
    ip: r.ip ? String(r.ip) : null,
    userAgent: r.user_agent ? String(r.user_agent) : null,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ""),
  }));
}

export async function listAdminAuditLogs(limit = 100) {
  await ensureAdminSecuritySchema();
  const rows = await sql`
    SELECT * FROM "AdminAuditLog" ORDER BY created_at DESC LIMIT ${limit}
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    actorId: String(r.actor_id),
    actorEmail: r.actor_email ? String(r.actor_email) : null,
    action: String(r.action),
    targetType: r.target_type ? String(r.target_type) : null,
    targetId: r.target_id ? String(r.target_id) : null,
    details: r.details ? String(r.details) : null,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ""),
  }));
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
