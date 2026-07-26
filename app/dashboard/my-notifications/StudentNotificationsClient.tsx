"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/LocaleProvider";

type Notif = {
  id: string;
  title?: string;
  body?: string;
  link?: string | null;
  readAt?: string | null;
  createdAt?: string;
};

function normalizeNotif(raw: Record<string, unknown>): Notif {
  return {
    id: String(raw.id ?? ""),
    title: raw.title != null ? String(raw.title) : undefined,
    body: raw.body != null ? String(raw.body) : undefined,
    link: raw.link != null ? String(raw.link) : null,
    readAt:
      raw.readAt != null
        ? String(raw.readAt)
        : raw.read_at != null
          ? String(raw.read_at)
          : null,
    createdAt:
      raw.createdAt != null
        ? String(raw.createdAt)
        : raw.created_at != null
          ? String(raw.created_at)
          : undefined,
  };
}

export function StudentNotificationsClient() {
  const t = useT();
  const [items, setItems] = useState<Notif[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/notifications", { credentials: "include" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Failed");
        const list = (d.notifications ?? d.items ?? []) as Record<string, unknown>[];
        setItems(list.map(normalizeNotif).filter((n) => n.id));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li
          key={n.id}
          className={`rounded-xl border px-4 py-3 text-sm ${
            n.readAt
              ? "border-[var(--color-border)] opacity-80"
              : "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5"
          }`}
        >
          <p className="font-semibold">{n.title || t("studentDash.notification", "Notification")}</p>
          {n.body ? <p className="mt-1 text-[var(--color-muted)]">{n.body}</p> : null}
          {n.link ? (
            <Link href={n.link} className="mt-2 inline-block text-xs underline">
              {t("studentDash.open", "Open")}
            </Link>
          ) : null}
        </li>
      ))}
      {items.length === 0 ? (
        <li className="text-sm text-[var(--color-muted)]">
          {t("studentDash.noNotifications", "No notifications.")}
        </li>
      ) : null}
    </ul>
  );
}
