"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import type { PermissionFlags, PermissionOverride } from "@/lib/lms-features-db";

const EMPTY: PermissionFlags = {
  canCreateCourses: false,
  canPostJobs: false,
  canCreateForumTopics: false,
  canModerateForum: false,
  canManageLibrary: false,
  canManageCoupons: false,
  canViewAnalytics: false,
};

const TEMPLATES: { id: string; label: string; flags: PermissionFlags }[] = [
  {
    id: "jobs",
    label: "Jobs admin",
    flags: { ...EMPTY, canPostJobs: true },
  },
  {
    id: "library",
    label: "Library admin",
    flags: { ...EMPTY, canManageLibrary: true },
  },
  {
    id: "forum",
    label: "Forum moderator",
    flags: { ...EMPTY, canCreateForumTopics: true, canModerateForum: true },
  },
  {
    id: "analytics",
    label: "Analytics / accounting",
    flags: { ...EMPTY, canViewAnalytics: true },
  },
];

const FLAG_LABELS: Record<keyof PermissionFlags, string> = {
  canCreateCourses: "Create courses",
  canPostJobs: "Post jobs",
  canCreateForumTopics: "Create forum topics",
  canModerateForum: "Moderate forum",
  canManageLibrary: "Manage library",
  canManageCoupons: "Manage coupons",
  canViewAnalytics: "View analytics",
};

const FLAG_KEYS = Object.keys(EMPTY) as (keyof PermissionFlags)[];

export function PermissionsAdminClient() {
  const t = useT();
  const [overrides, setOverrides] = useState<PermissionOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mode, setMode] = useState<"role" | "user">("role");
  const [role, setRole] = useState("TEACHER");
  const [userId, setUserId] = useState("");
  const [flags, setFlags] = useState<PermissionFlags>({ ...EMPTY });

  const reload = useCallback(async () => {
    const res = await fetch("/api/dashboard/permissions");
    if (!res.ok) return;
    const data = await res.json();
    setOverrides(data.overrides ?? []);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const body =
      mode === "role"
        ? { role, userId: null, ...flags }
        : { userId: userId.trim(), role: null, ...flags };
    const res = await fetch("/api/dashboard/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    setSuccess(t("dashboard.permissions.saved", "Saved"));
    await reload();
  }

  async function remove(id: string) {
    if (!confirm(t("dashboard.permissions.confirmDelete", "Delete this override?"))) return;
    await fetch(`/api/dashboard/permissions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await reload();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={(e) => void save(e)} className="space-y-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="font-semibold text-[var(--color-foreground)]">
          {t("dashboard.permissions.grantTitle", "Grant permissions")}
        </h3>
        <p className="text-sm text-[var(--color-muted)]">
          {t(
            "dashboard.permissions.grantHint",
            "Role mode sets a template for that role. User mode saves permissions on a specific account (any student, teacher, or admin). Prefer Manage permissions on the account page when available.",
          )}
        </p>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={mode === "role"} onChange={() => setMode("role")} />
            {t("dashboard.permissions.byRole", "By role")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={mode === "user"} onChange={() => setMode("user")} />
            {t("dashboard.permissions.byUser", "By user ID")}
          </label>
        </div>
        {mode === "role" ? (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          >
            <option value="STUDENT">STUDENT</option>
            <option value="TEACHER">TEACHER</option>
            <option value="ASSISTANT_ADMIN">ASSISTANT_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        ) : (
          <div className="space-y-1">
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={t("dashboard.permissions.userIdPlaceholder", "Account user ID")}
              required
              className="w-full max-w-md rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
            <p className="text-xs text-[var(--color-muted)]">
              {t(
                "dashboard.permissions.userModeHint",
                "Works for any account type. Saved as user-level permissions for that account.",
              )}
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setFlags({ ...tpl.flags })}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-border)]/40"
            >
              {t(`dashboard.permissions.tpl.${tpl.id}`, tpl.label)}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {FLAG_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={flags[key]}
                onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))}
              />
              {t(`dashboard.permissions.flags.${key}`, FLAG_LABELS[key])}
            </label>
          ))}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "…" : t("dashboard.permissions.save", "Save")}
        </button>
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
              <th className="p-3 text-start">Target</th>
              <th className="p-3 text-start">Flags</th>
              <th className="p-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {overrides.map((o) => (
              <tr key={o.id} className="border-b border-[var(--color-border)]">
                <td className="p-3">
                  {o.userId ? `User: ${o.userId}` : `Role: ${o.role}`}
                </td>
                <td className="p-3 text-xs text-[var(--color-muted)]">
                  {FLAG_KEYS.filter((k) => o[k]).map((k) => FLAG_LABELS[k]).join(", ") || "—"}
                </td>
                <td className="p-3">
                  <button type="button" onClick={() => void remove(o.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {overrides.length === 0 ? (
          <p className="p-4 text-sm text-[var(--color-muted)]">No overrides yet.</p>
        ) : null}
      </div>
    </div>
  );
}
