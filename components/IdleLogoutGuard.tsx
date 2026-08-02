"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOutFully } from "@/lib/client-sign-out";

export function IdleLogoutGuard({ idleMinutes }: { idleMinutes: number }) {
  const { status } = useSession();
  const ms = Math.max(5, idleMinutes) * 60 * 1000;

  useEffect(() => {
    if (status !== "authenticated") return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const reset = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void signOutFully({ callbackUrl: "/login?reason=idle", reason: "idle" });
      }, ms);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    for (const ev of events) window.addEventListener(ev, reset, { passive: true });
    reset();

    return () => {
      if (timer) clearTimeout(timer);
      for (const ev of events) window.removeEventListener(ev, reset);
    };
  }, [status, ms]);

  return null;
}

export function IdleLogoutGuardLoader() {
  const [minutes, setMinutes] = useState(60);
  useEffect(() => {
    fetch("/api/dashboard/settings/security")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.idleTimeoutMinutes) setMinutes(Number(d.idleTimeoutMinutes));
      })
      .catch(() => undefined);
  }, []);
  return <IdleLogoutGuard idleMinutes={minutes} />;
}
