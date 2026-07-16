"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export function NewThreadForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const t = useT();
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, title, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("forum.createFailed", "Failed to create topic"));
      router.push(`/forum/${encodeURIComponent(data.id)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("forum.createFailed", "Failed to create topic"));
      setLoading(false);
    }
  }

  if (categories.length === 0) {
    return (
      <p className="mt-6 text-sm text-[var(--color-muted)]">
        {t("forum.noCategories", "No forum categories are available yet.")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)]">
          {t("forum.category", "Category")}
        </label>
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)]">
          {t("forum.title", "Title")}
        </label>
        <input
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)]">
          {t("forum.body", "Message")}
        </label>
        <textarea
          required
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
        />
      </div>
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? t("forum.publishing", "Publishing…") : t("forum.publish", "Publish")}
      </button>
    </form>
  );
}
