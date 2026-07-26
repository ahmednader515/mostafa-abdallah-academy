import type { UserRole } from "@/lib/types";
import { sql } from "@/lib/db";

export type PermissionFlag =
  | "canCreateCourses"
  | "canPostJobs"
  | "canCreateForumTopics"
  | "canManageLibrary"
  | "canManageLive"
  | "canModerateForum";

export function isStaffRole(role: string): role is "ADMIN" | "ASSISTANT_ADMIN" | "TEACHER" {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
}

/** أدمن أو مساعد: يديرون كل الكورسات؛ مدرس: كورساته فقط */
export function canManageCourse(
  role: UserRole | string,
  sessionUserId: string,
  courseCreatedById: string | null | undefined,
): boolean {
  if (role === "ADMIN" || role === "ASSISTANT_ADMIN") return true;
  if (role === "TEACHER") {
    return !!courseCreatedById && courseCreatedById === sessionUserId;
  }
  return false;
}

async function ensurePermissionSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS "PermissionOverride" (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      role TEXT,
      flag TEXT NOT NULL,
      allowed BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function setPermissionOverride(data: {
  userId?: string | null;
  role?: string | null;
  flag: PermissionFlag;
  allowed: boolean;
}): Promise<void> {
  await ensurePermissionSchema();
  const id = `po_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  await sql`
    INSERT INTO "PermissionOverride" (id, user_id, role, flag, allowed)
    VALUES (${id}, ${data.userId ?? null}, ${data.role ?? null}, ${data.flag}, ${data.allowed})
  `;
}

export async function hasPermission(
  userId: string,
  role: UserRole | string,
  flag: PermissionFlag,
): Promise<boolean> {
  if (role === "ADMIN") return true;
  await ensurePermissionSchema();
  const userRows = await sql`
    SELECT allowed FROM "PermissionOverride"
    WHERE user_id = ${userId} AND flag = ${flag}
    ORDER BY created_at DESC LIMIT 1
  `;
  if (userRows[0]) return Boolean((userRows[0] as { allowed: boolean }).allowed);

  const roleRows = await sql`
    SELECT allowed FROM "PermissionOverride"
    WHERE role = ${role} AND user_id IS NULL AND flag = ${flag}
    ORDER BY created_at DESC LIMIT 1
  `;
  if (roleRows[0]) return Boolean((roleRows[0] as { allowed: boolean }).allowed);

  if (role === "TEACHER") {
    return flag === "canCreateCourses" || flag === "canManageLive" || flag === "canCreateForumTopics";
  }
  if (role === "ASSISTANT_ADMIN") return true;
  return false;
}
