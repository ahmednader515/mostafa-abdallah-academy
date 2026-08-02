"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/LocaleProvider";

type LoginLog = {
  id: string;
  userName: string | null;
  email: string | null;
  ip: string | null;
  status: string;
  loggedInAt?: string;
  createdAt: string;
};
type AuditLog = {
  id: string;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  method: string | null;
  path: string | null;
  ip: string | null;
  createdAt: string;
};

export function SecuritySettingsClient({ canEditIdle }: { canEditIdle: boolean }) {
  const t = useT();
  const [idle, setIdle] = useState(60);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [msg, setMsg] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActor, setAuditActor] = useState("");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");

  const reload = useCallback(async () => {
    const qs = new URLSearchParams();
    if (auditSearch.trim()) qs.set("auditSearch", auditSearch.trim());
    if (auditActor.trim()) qs.set("auditActor", auditActor.trim());
    if (auditFrom) qs.set("auditFrom", new Date(auditFrom).toISOString());
    if (auditTo) {
      const end = new Date(auditTo);
      end.setHours(23, 59, 59, 999);
      qs.set("auditTo", end.toISOString());
    }
    const res = await fetch(`/api/dashboard/settings/security?${qs}`);
    if (!res.ok) return;
    const data = await res.json();
    setIdle(Number(data.idleTimeoutMinutes ?? 60));
    setLoginLogs(data.loginLogs ?? []);
    setAuditLogs(data.auditLogs ?? []);
  }, [auditSearch, auditActor, auditFrom, auditTo]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function saveIdle(e: React.FormEvent) {
    e.preventDefault();
    if (!canEditIdle) return;
    const res = await fetch("/api/dashboard/settings/security", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idleTimeoutMinutes: idle }),
    });
    if (res.ok) setMsg(t("dashboard.security.saved", "Saved"));
  }

  return (
    <div className="space-y-8">
      {canEditIdle ? (
        <form
          onSubmit={(e) => void saveIdle(e)}
          className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
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
            <button
              type="submit"
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white"
            >
              {t("dashboard.security.save", "Save")}
            </button>
          </div>
          {msg ? <p className="mt-2 text-sm text-emerald-600">{msg}</p> : null}
        </form>
      ) : null}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">{t("dashboard.security.loginLog", "Login log")}</h3>
          <Link
            href="/dashboard/settings/login-log"
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            {t("dashboard.security.viewFullLoginLog", "View full Login Log")}
          </Link>
        </div>
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
                <th className="p-2 text-start">{t("dashboard.loginLog.colUser", "User")}</th>
                <th className="p-2 text-start">{t("dashboard.loginLog.colEmail", "Email")}</th>
                <th className="p-2 text-start">{t("dashboard.loginLog.colIp", "IP")}</th>
                <th className="p-2 text-start">{t("dashboard.loginLog.colStatus", "Status")}</th>
                <th className="p-2 text-start">{t("dashboard.loginLog.colLogin", "Login")}</th>
              </tr>
            </thead>
            <tbody>
              {loginLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-3 text-[var(--color-muted)]">
                    {t("dashboard.loginLog.empty", "No login records")}
                  </td>
                </tr>
              ) : (
                loginLogs.map((l) => (
                  <tr key={l.id} className="border-b border-[var(--color-border)]">
                    <td className="p-2">{l.userName ?? "—"}</td>
                    <td className="p-2">{l.email ?? "—"}</td>
                    <td className="p-2 font-mono text-xs" dir="ltr">
                      {l.ip ?? "—"}
                    </td>
                    <td className="p-2 text-xs">
                      {l.status === "failed"
                        ? t("dashboard.loginLog.statusFailed", "Failed")
                        : t("dashboard.loginLog.statusSuccess", "Success")}
                    </td>
                    <td className="p-2 text-xs text-[var(--color-muted)]">
                      {new Date(l.loggedInAt || l.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-semibold">{t("dashboard.security.auditLog", "Admin audit log")}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void reload();
          }}
          className="mb-3 flex flex-wrap items-end gap-3"
        >
          <label className="flex min-w-[8rem] flex-1 flex-col gap-1 text-sm">
            <span>{t("dashboard.security.auditSearch", "Search")}</span>
            <input
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder={t("dashboard.security.auditSearchPh", "Action, path, details…")}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </label>
          <label className="flex min-w-[8rem] flex-col gap-1 text-sm">
            <span>{t("dashboard.security.auditActor", "Actor")}</span>
            <input
              value={auditActor}
              onChange={(e) => setAuditActor(e.target.value)}
              placeholder={t("dashboard.security.auditActorPh", "Email…")}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{t("dashboard.loginLog.from", "From")}</span>
            <input
              type="date"
              value={auditFrom}
              onChange={(e) => setAuditFrom(e.target.value)}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{t("dashboard.loginLog.to", "To")}</span>
            <input
              type="date"
              value={auditTo}
              onChange={(e) => setAuditTo(e.target.value)}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm"
          >
            {t("dashboard.loginLog.apply", "Apply")}
          </button>
        </form>

        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full min-w-[48rem] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
                <th className="p-2 text-start">{t("dashboard.security.colActor", "Actor")}</th>
                <th className="p-2 text-start">{t("dashboard.security.colAction", "Action")}</th>
                <th className="p-2 text-start">{t("dashboard.security.colPath", "Path / target")}</th>
                <th className="p-2 text-start">{t("dashboard.security.colDetails", "Details")}</th>
                <th className="p-2 text-start">{t("dashboard.loginLog.colIp", "IP")}</th>
                <th className="p-2 text-start">{t("dashboard.security.colWhen", "When")}</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-3 text-[var(--color-muted)]">
                    {t("dashboard.security.auditEmpty", "No audit records")}
                  </td>
                </tr>
              ) : (
                auditLogs.map((l) => (
                  <tr key={l.id} className="border-b border-[var(--color-border)] align-top">
                    <td className="p-2">{l.actorEmail ?? "—"}</td>
                    <td className="p-2">
                      <span className="font-medium">{l.action}</span>
                      {l.method ? (
                        <span className="ms-1 text-xs text-[var(--color-muted)]">{l.method}</span>
                      ) : null}
                    </td>
                    <td className="max-w-[14rem] truncate p-2 text-xs" title={l.path ?? ""}>
                      {l.path || [l.targetType, l.targetId].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="max-w-[12rem] truncate p-2 text-xs" title={l.details ?? ""}>
                      {l.details ?? "—"}
                    </td>
                    <td className="p-2 font-mono text-xs" dir="ltr">
                      {l.ip ?? "—"}
                    </td>
                    <td className="p-2 text-xs text-[var(--color-muted)]">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
