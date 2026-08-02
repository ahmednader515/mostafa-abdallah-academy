"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export const MESSAGES_READ_EVENT = "worldway:messages-read";

/** Unread message count badge for the envelope icon. */
export function MessagesUnreadBadge() {
  const { status } = useSession();
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (status !== "authenticated") {
      setCount(0);
      return;
    }
    try {
      const res = await fetch("/api/messages/unread-count", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setCount(Number(data.count) || 0);
    } catch {
      /* ignore */
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      setCount(0);
      return;
    }
    void load();
    const id = setInterval(() => void load(), 15000);
    const onRead = () => void load();
    const onFocus = () => void load();
    window.addEventListener(MESSAGES_READ_EVENT, onRead);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener(MESSAGES_READ_EVENT, onRead);
      window.removeEventListener("focus", onFocus);
    };
  }, [status, load]);

  // Refresh when navigating to/from the messages page.
  useEffect(() => {
    if (status !== "authenticated") return;
    if (pathname?.startsWith("/dashboard/messages")) {
      void load();
    }
  }, [pathname, status, load]);

  if (count <= 0) return null;
  return (
    <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
