"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/LocaleProvider";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | Date | null;
  createdAt: string | Date;
};

function formatRelativeTime(iso: string | Date, locale: string): string {
  const date = iso instanceof Date ? iso : new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(-diffDay, "day");
}

export function NotificationsBell() {
  const { status } = useSession();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(Number(data.unreadCount) || 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- polling should only restart on auth status change
  }, [status]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUnreadCount(Number(data.unreadCount) || 0);
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      }
    } catch {
      /* ignore */
    }
  }

  async function markOneRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* ignore */
    }
  }

  if (status !== "authenticated") return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) loadNotifications();
        }}
        className="relative hidden h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white sm:flex"
        aria-label={t("nav.notifications", "Notifications")}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 18.5a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute end-0 top-full z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-white/10 bg-[#0F172A] shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
            <span className="text-sm font-semibold text-white">{t("nav.notifications", "Notifications")}</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-[#60A5FA] hover:underline"
              >
                {t("notifications.markAllRead", "Mark all as read")}
              </button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-400">{t("common.loading", "Loading...")}</p>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-400">
                {t("notifications.empty", "No notifications yet")}
              </p>
            ) : (
              notifications.map((n) => {
                const unread = !n.readAt;
                const content = (
                  <div
                    className={`border-b border-white/5 px-3 py-2.5 text-start transition hover:bg-white/5 ${
                      unread ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {unread ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" /> : null}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-100">{n.title}</p>
                        {n.body ? <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{n.body}</p> : null}
                        <p className="mt-1 text-[11px] text-slate-500">{formatRelativeTime(n.createdAt, "ar")}</p>
                      </div>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => markOneRead(n.id)} className="block">
                    {content}
                  </Link>
                ) : (
                  <button key={n.id} type="button" onClick={() => markOneRead(n.id)} className="block w-full">
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
