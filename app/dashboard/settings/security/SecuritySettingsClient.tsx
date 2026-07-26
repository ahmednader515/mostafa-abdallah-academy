"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";

type LoginLog = {
  id: string;
  userName: string | null;
  email: string | null;
  ip: string | null;
  createdAt: string;
};
type AuditLog = {
  id: string;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  createdAt: string;
};

export function SecuritySettingsClient() {
  const t = useT();
  const [idle, setIdle] = useState(60);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [msg, setMsg] = useState("");

  const reload = useCallback(async () => {
    const res = await fetch("/api/dashboard/settings/security");
    if (!res.ok) return;
    const data = await res.json();
    setIdle(Number(data.idleTimeoutMinutes ?? 60));
    setLoginLogs(data.loginLogs ?? []);
    setAuditLogs(data.auditLogs ?? []);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function saveIdle(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/dashboard/settings/security", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idleTimeoutMinutes: idle }),
    });
    if (res.ok) setMsg(t("dashboard.security.saved", "Saved"));
  }

  return (
    <div className="space-y-8">
      <form onSubmit={(e) => void saveIdle(e)} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="font-semibold">{t("dashboard.security.idleTitle", "Idle auto-logout")}</h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("dashboard.security.idleHint", "Minutes of inactivity before signing out.")}
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <input
            type="number"
            min={5}
            max={1440}
            value={idle}
            onChange={(e) => setIdle(Number(e.target.value))}
            className="w-28 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <button type="submit" className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white">
            {t("dashboard.security.save", "Save")}
          </button>
        </div>
        {msg ? <p className="mt-2 text-sm text-emerald-600">{msg}</p> : null}
      </form>

      <section>
        <h3 className="mb-3 font-semibold">{t("dashboard.security.loginLog", "Login log")}</h3>
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
                <th className="p-2 text-start">User</th>
                <th className="p-2 text-start">Email</th>
                <th className="p-2 text-start">When</th>
              </tr>
            </thead>
            <tbody>
              {loginLogs.map((l) => (
                <tr key={l.id} className="border-b border-[var(--color-border)]">
                  <td className="p-2">{l.userName ?? "—"}</td>
                  <td className="p-2">{l.email ?? "—"}</td>
                  <td className="p-2 text-xs text-[var(--color-muted)]">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-semibold">{t("dashboard.security.auditLog", "Admin audit log")}</h3>
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
                <th className="p-2 text-start">Actor</th>
                <th className="p-2 text-start">Action</th>
                <th className="p-2 text-start">Target</th>
                <th className="p-2 text-start">When</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((l) => (
                <tr key={l.id} className="border-b border-[var(--color-border)]">
                  <td className="p-2">{l.actorEmail ?? "—"}</td>
                  <td className="p-2">{l.action}</td>
                  <td className="p-2 text-xs">{[l.targetType, l.targetId].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="p-2 text-xs text-[var(--color-muted)]">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
