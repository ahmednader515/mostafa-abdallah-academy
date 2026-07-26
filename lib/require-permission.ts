import { getEffectivePermissions, type PermissionFlags } from "@/lib/lms-features-db";

export async function requireStaffPermission(
  userId: string,
  role: string,
  flag: keyof PermissionFlags,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (role === "ADMIN") return { ok: true };
  const perms = await getEffectivePermissions(userId, role);
  if (perms[flag]) return { ok: true };
  return { ok: false, status: 403, error: "غير مصرح لهذه الصلاحية" };
}
