"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export function ReplyForm({ threadId }: { threadId: string }) {
  const t = useT();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/forum/${encodeURIComponent(threadId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("forum.replyFailed", "Failed to post reply"));
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("forum.replyFailed", "Failed to post reply"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label className="block text-sm font-medium text-[var(--color-foreground)]">
        {t("forum.yourReply", "Your reply")}
      </label>
      <textarea
        required
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
      />
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? t("forum.sending", "Sending…") : t("forum.sendReply", "Post reply")}
      </button>
    </form>
  );
}
