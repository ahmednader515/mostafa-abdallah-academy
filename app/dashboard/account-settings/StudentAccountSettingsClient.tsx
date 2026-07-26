"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/components/LocaleProvider";

export function StudentAccountSettingsClient({
  devices,
}: {
  devices: { id: string; ip: string | null; userAgent: string | null; at: string }[];
}) {
  const t = useT();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="font-semibold">{t("studentDash.language", "Language")}</h3>
        <div className="mt-3">
          <LanguageToggle />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="font-semibold">{t("studentDash.notificationsPrefs", "Notifications")}</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t(
            "studentDash.notificationsPrefsHint",
            "You receive platform alerts in the top-bar bell and the notifications page.",
          )}
        </p>
        <Link href="/dashboard/my-notifications" className="mt-3 inline-block text-sm underline">
          {t("studentDash.nav.notifications", "Notifications")}
        </Link>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="font-semibold">{t("studentDash.devices", "Logged-in devices")}</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {devices.map((d) => (
            <li key={d.id} className="rounded border border-[var(--color-border)] px-3 py-2">
              <p className="tabular-nums text-xs text-[var(--color-muted)]">{d.at.slice(0, 19).replace("T", " ")}</p>
              <p dir="ltr" className="truncate text-xs">
                {d.ip || "—"} · {d.userAgent || "—"}
              </p>
            </li>
          ))}
          {devices.length === 0 ? (
            <li className="text-[var(--color-muted)]">{t("studentDash.noDevices", "No login history yet.")}</li>
          ) : null}
        </ul>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link href="/dashboard/profile" className="rounded border px-4 py-2 text-sm">
          {t("studentDash.nav.profile", "Profile")}
        </Link>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {t("studentDash.logout", "Log out")}
        </button>
      </section>
    </div>
  );
}
