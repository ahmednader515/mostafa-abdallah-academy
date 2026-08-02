"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import type { PermissionFlags } from "@/lib/lms-features-db";

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
  {
    id: "courses",
    label: "Course creator",
    flags: { ...EMPTY, canCreateCourses: true },
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

export function ManageUserPermissionsModal({
  userId,
  userName,
  userRole,
  open,
  onClose,
  onSaved,
}: {
  userId: string;
  userName: string;
  userRole: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const t = useT();
  const [flags, setFlags] = useState<PermissionFlags>({ ...EMPTY });
  const [hasUserOverride, setHasUserOverride] = useState(false);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open || !userId) return;
    setError("");
    setSuccess("");
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/dashboard/permissions?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(userRole)}`,
          { credentials: "include" },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? t("dashboard.permissions.loadFailed", "Failed to load permissions"));
          return;
        }
        setFlags({ ...EMPTY, ...(data.flags as PermissionFlags) });
        setHasUserOverride(!!data.hasUserOverride);
        setOverrideId(typeof data.overrideId === "string" ? data.overrideId : null);
      } catch {
        setError(t("dashboard.permissions.loadFailed", "Failed to load permissions"));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, userId, userRole, t]);

  if (!open) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/permissions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: null, ...flags }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("dashboard.permissions.saveFailed", "Failed to save"));
        return;
      }
      setSuccess(t("dashboard.permissions.saved", "Saved"));
      setHasUserOverride(true);
      if (data.override?.id) setOverrideId(String(data.override.id));
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  async function clearOverride() {
    if (!overrideId) return;
    if (!confirm(t("dashboard.permissions.confirmDelete", "Delete this override?"))) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/permissions?id=${encodeURIComponent(overrideId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("dashboard.permissions.deleteFailed", "Failed to delete"));
        return;
      }
      setSuccess(t("dashboard.permissions.resetToRole", "Reset to role defaults"));
      setHasUserOverride(false);
      setOverrideId(null);
      // reload effective
      const reload = await fetch(
        `/api/dashboard/permissions?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(userRole)}`,
        { credentials: "include" },
      );
      const data = await reload.json().catch(() => ({}));
      if (reload.ok && data.flags) setFlags({ ...EMPTY, ...(data.flags as PermissionFlags) });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="manage-perms-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="manage-perms-title" className="text-lg font-semibold text-[var(--color-foreground)]">
          {t("dashboard.permissions.manageTitle", "Manage permissions")}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {userName} · {userRole}
        </p>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          {t(
            "dashboard.permissions.userLevelHint",
            "These checkboxes are saved on this account (user permissions), not only on the role.",
          )}
          {hasUserOverride
            ? ` ${t("dashboard.permissions.hasOverride", "A custom override is active for this account.")}`
            : ` ${t("dashboard.permissions.usingRoleDefaults", "Currently using role defaults until you save.")}`}
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-[var(--color-muted)]">{t("common.loading", "Loading…")}</p>
        ) : (
          <form onSubmit={(e) => void save(e)} className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setFlags({ ...tpl.flags })}
                  className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-[var(--color-border)]/40"
                >
                  {t(`dashboard.permissions.tpl.${tpl.id}`, tpl.label)}
                </button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FLAG_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
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
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "…" : t("dashboard.permissions.save", "Save")}
              </button>
              {hasUserOverride && overrideId ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void clearOverride()}
                  className="rounded-[var(--radius-btn)] border border-red-500/40 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
                >
                  {t("dashboard.permissions.resetOverride", "Reset to role defaults")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
