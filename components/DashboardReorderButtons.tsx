"use client";

import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

export type ReorderEntity =
  | "category"
  | "course"
  | "libraryCategory"
  | "libraryItem"
  | "job";

export function DashboardReorderButtons({
  entity,
  orderedIds,
  index,
  onReordered,
  disabled,
}: {
  entity: ReorderEntity;
  orderedIds: string[];
  index: number;
  onReordered?: () => void;
  disabled?: boolean;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function move(direction: "up" | "down") {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= orderedIds.length || busy || disabled) return;
    const next = [...orderedIds];
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    setBusy(true);
    try {
      const res = await fetch("/api/dashboard/reorder", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, orderedIds: next }),
      });
      if (!res.ok) return;
      onReordered?.();
    } finally {
      setBusy(false);
    }
  }

  const btnClass =
    "rounded border border-[var(--color-border)] px-2 py-1 text-xs disabled:opacity-40 hover:bg-[var(--color-background)]";

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={busy || disabled || index === 0}
        onClick={() => void move("up")}
        className={btnClass}
        title={t("dashboard.coursesList.moveUpTitle", "Move up")}
        aria-label={t("dashboard.coursesList.moveUpTitle", "Move up")}
      >
        ↑
      </button>
      <button
        type="button"
        disabled={busy || disabled || index === orderedIds.length - 1}
        onClick={() => void move("down")}
        className={btnClass}
        title={t("dashboard.coursesList.moveDownTitle", "Move down")}
        aria-label={t("dashboard.coursesList.moveDownTitle", "Move down")}
      >
        ↓
      </button>
    </div>
  );
}
