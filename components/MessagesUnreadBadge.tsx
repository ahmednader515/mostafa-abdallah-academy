"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/** Unread message count badge for the envelope icon. */
export function MessagesUnreadBadge() {
  const { status } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setCount(0);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/messages/unread-count", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCount(Number(data.count) || 0);
      } catch {
        /* ignore */
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [status]);

  if (count <= 0) return null;
  return (
    <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
