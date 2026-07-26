"use client";

import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export function NotificationsBroadcastClient({
  courses,
  students,
}: {
  courses: { id: string; title: string }[];
  students: { id: string; name: string; email: string }[];
}) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [target, setTarget] = useState<"all_students" | "course" | "user">("all_students");
  const [courseId, setCourseId] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    const res = await fetch("/api/dashboard/notifications/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        imageUrl: imageUrl.trim() || null,
        target,
        courseId: target === "course" ? courseId : undefined,
        userId: target === "user" ? userId : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    setMsg(t("dashboard.notifications.sent", "Sent to {n} users").replace("{n}", String(data.sent ?? 0)));
    setTitle("");
    setBody("");
    setImageUrl("");
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="max-w-xl space-y-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div>
        <label className="block text-sm font-medium">{t("dashboard.notifications.titleField", "Title")}</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">{t("dashboard.notifications.bodyField", "Content")}</label>
        <textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">{t("dashboard.notifications.imageOptional", "Image URL (optional)")}</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">{t("dashboard.notifications.target", "Audience")}</label>
        <select value={target} onChange={(e) => setTarget(e.target.value as typeof target)} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
          <option value="all_students">{t("dashboard.notifications.allStudents", "All students")}</option>
          <option value="course">{t("dashboard.notifications.byCourse", "By course")}</option>
          <option value="user">{t("dashboard.notifications.byUser", "By user")}</option>
        </select>
      </div>
      {target === "course" ? (
        <select required value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
          <option value="">—</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      ) : null}
      {target === "user" ? (
        <select required value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
          <option value="">—</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
          ))}
        </select>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
      <button type="submit" disabled={loading} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {loading ? "…" : t("dashboard.notifications.send", "Send broadcast")}
      </button>
    </form>
  );
}
