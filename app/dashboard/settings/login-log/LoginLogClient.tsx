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
  failureReason: string | null;
  loggedInAt: string;
  loggedOutAt: string | null;
  sessionDurationSeconds: number | null;
  lastAction: string | null;
  deviceType: string | null;
  browser: string | null;
};

function formatDuration(seconds: number | null, t: (k: string, f: string) => string): string {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return t("dashboard.loginLog.durationHms", "{h}h {m}m {s}s")
    .replace("{h}", String(h))
    .replace("{m}", String(m))
    .replace("{s}", String(sec));
  if (m > 0) return t("dashboard.loginLog.durationMs", "{m}m {s}s")
    .replace("{m}", String(m))
    .replace("{s}", String(sec));
  return t("dashboard.loginLog.durationS", "{s}s").replace("{s}", String(sec));
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function LoginLogClient() {
  const t = useT();
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "success" | "failed">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const reload = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("search", search.trim());
    if (status !== "all") qs.set("status", status);
    if (from) qs.set("from", new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      qs.set("to", end.toISOString());
    }
    qs.set("limit", String(limit));
    qs.set("offset", String(offset));
    try {
      const res = await fetch(`/api/dashboard/settings/login-log?${qs}`);
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(Number(data.total ?? 0));
    } finally {
      setLoading(false);
    }
  }, [search, status, from, to, offset]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setOffset(0);
    void reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted)]">
          {t("dashboard.loginLog.total", "Total")}: {total}
        </p>
        <Link
          href="/dashboard/settings/security"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {t("dashboard.loginLog.backToSecurity", "Security & audit")}
        </Link>
      </div>

      <form
        onSubmit={applyFilters}
        className="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      >
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-sm">
          <span>{t("dashboard.loginLog.search", "Search")}</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("dashboard.loginLog.searchPh", "Name, email, or IP…")}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{t("dashboard.loginLog.status", "Status")}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          >
            <option value="all">{t("dashboard.loginLog.statusAll", "All")}</option>
            <option value="success">{t("dashboard.loginLog.statusSuccess", "Success")}</option>
            <option value="failed">{t("dashboard.loginLog.statusFailed", "Failed")}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{t("dashboard.loginLog.from", "From")}</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{t("dashboard.loginLog.to", "To")}</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white"
        >
          {t("dashboard.loginLog.apply", "Apply")}
        </button>
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[64rem] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50">
              <th className="p-2 text-start">{t("dashboard.loginLog.colUser", "User")}</th>
              <th className="p-2 text-start">{t("dashboard.loginLog.colEmail", "Email")}</th>
              <th className="p-2 text-start">{t("dashboard.loginLog.colLogin", "Login")}</th>
              <th className="p-2 text-start">{t("dashboard.loginLog.colLogout", "Logout")}</th>
              <th className="p-2 text-start">{t("dashboard.loginLog.colDuration", "Duration")}</th>
              <th className="p-2 text-start">{t("dashboard.loginLog.colLastAction", "Last action")}</th>
              <th className="p-2 text-start">{t("dashboard.loginLog.colIp", "IP")}</th>
              <th className="p-2 text-start">{t("dashboard.loginLog.colDevice", "Device / browser")}</th>
              <th className="p-2 text-start">{t("dashboard.loginLog.colStatus", "Status")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="p-4 text-[var(--color-muted)]">
                  {t("dashboard.loginLog.loading", "Loading…")}
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-4 text-[var(--color-muted)]">
                  {t("dashboard.loginLog.empty", "No login records")}
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-b border-[var(--color-border)] align-top">
                  <td className="p-2">{l.userName ?? "—"}</td>
                  <td className="p-2">{l.email ?? "—"}</td>
                  <td className="p-2 text-xs text-[var(--color-muted)]">{formatWhen(l.loggedInAt)}</td>
                  <td className="p-2 text-xs text-[var(--color-muted)]">{formatWhen(l.loggedOutAt)}</td>
                  <td className="p-2 text-xs">{formatDuration(l.sessionDurationSeconds, t)}</td>
                  <td className="max-w-[12rem] truncate p-2 text-xs" title={l.lastAction ?? ""}>
                    {l.lastAction ?? "—"}
                  </td>
                  <td className="p-2 font-mono text-xs" dir="ltr">
                    {l.ip ?? "—"}
                  </td>
                  <td className="p-2 text-xs">
                    {[l.deviceType, l.browser].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="p-2">
                    <span
                      className={
                        l.status === "failed"
                          ? "rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
                          : "rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      }
                    >
                      {l.status === "failed"
                        ? t("dashboard.loginLog.statusFailed", "Failed")
                        : t("dashboard.loginLog.statusSuccess", "Success")}
                    </span>
                    {l.failureReason ? (
                      <p className="mt-1 text-[10px] text-[var(--color-muted)]">{l.failureReason}</p>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={offset <= 0 || loading}
          onClick={() => setOffset((o) => Math.max(0, o - limit))}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-40"
        >
          {t("dashboard.loginLog.prev", "Previous")}
        </button>
        <button
          type="button"
          disabled={offset + limit >= total || loading}
          onClick={() => setOffset((o) => o + limit)}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-40"
        >
          {t("dashboard.loginLog.next", "Next")}
        </button>
        <span className="text-xs text-[var(--color-muted)]">
          {offset + 1}–{Math.min(offset + limit, total)} / {total}
        </span>
      </div>
    </div>
  );
}
