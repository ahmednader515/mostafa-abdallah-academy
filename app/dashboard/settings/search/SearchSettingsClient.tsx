"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import type { SearchFlags } from "@/lib/search-flags";

export function SearchSettingsClient() {
  const t = useT();
  const [flags, setFlags] = useState<SearchFlags>({
    enabled: true,
    courses: true,
    forum: true,
    library: true,
    jobs: true,
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/settings/search")
      .then((r) => r.json())
      .then((d) => {
        if (d.flags) setFlags(d.flags);
      })
      .catch(() => undefined);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/dashboard/settings/search", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flags }),
    });
    if (res.ok) setMsg(t("dashboard.searchSettings.saved", "Saved"));
  }

  return (
    <form onSubmit={(e) => void save(e)} className="max-w-md space-y-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      {(
        [
          ["enabled", "Enable search"],
          ["courses", "Search courses"],
          ["forum", "Search forum"],
          ["library", "Search library"],
          ["jobs", "Search jobs"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={flags[key]}
            onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))}
          />
          {t(`dashboard.searchSettings.${key}`, label)}
        </label>
      ))}
      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
      <button type="submit" className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white">
        {t("dashboard.searchSettings.save", "Save")}
      </button>
    </form>
  );
}
