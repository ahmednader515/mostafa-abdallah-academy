"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export function ThreadActions({
  threadId,
  isPinned,
  isLocked,
  isStaff,
}: {
  threadId: string;
  isPinned: boolean;
  isLocked: boolean;
  isStaff: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(data: { pinned?: boolean; locked?: boolean }) {
    setLoading(true);
    try {
      await fetch(`/api/forum/${encodeURIComponent(threadId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!confirm(t("forum.confirmDelete", "Delete this topic?"))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/forum/${encodeURIComponent(threadId)}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/forum");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
      {isStaff ? (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => void patch({ pinned: !isPinned })}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium disabled:opacity-60"
          >
            {isPinned ? t("forum.unpin", "Unpin") : t("forum.pin", "Pin")}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void patch({ locked: !isLocked })}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium disabled:opacity-60"
          >
            {isLocked ? t("forum.unlock", "Unlock") : t("forum.lock", "Lock")}
          </button>
        </>
      ) : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void remove()}
        className="rounded-[var(--radius-btn)] border border-[var(--color-danger)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] disabled:opacity-60"
      >
        {t("forum.delete", "Delete")}
      </button>
    </div>
  );
}
