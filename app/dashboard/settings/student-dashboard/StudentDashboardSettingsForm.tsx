"use client";

import { useState } from "react";
import { useT } from "@/components/LocaleProvider";
import {
  STUDENT_DASHBOARD_SECTION_META,
  type StudentDashboardFlags,
} from "@/lib/student-dashboard-flags";

export function StudentDashboardSettingsForm({
  initialFlags,
}: {
  initialFlags: StudentDashboardFlags;
}) {
  const t = useT();
  const [flags, setFlags] = useState(initialFlags);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setSaving(true);
    setMsg("");
    const r = await fetch("/api/dashboard/settings/student-dashboard", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flags }),
    });
    setSaving(false);
    if (!r.ok) {
      setMsg(t("studentDash.settingsSaveFailed", "Save failed"));
      return;
    }
    setMsg(t("studentDash.settingsSaved", "Saved"));
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-[var(--color-muted)]">
        {t(
          "studentDash.settingsIntro",
          "Choose which sections appear in the student dashboard navigation.",
        )}
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {STUDENT_DASHBOARD_SECTION_META.map((s) => (
          <label
            key={s.key}
            className="flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={flags[s.key]}
              onChange={(e) => setFlags((f) => ({ ...f, [s.key]: e.target.checked }))}
            />
            {t(`studentDash.nav.${s.key}`, s.labelEn)}
          </label>
        ))}
      </div>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? t("common.saving", "Saving…") : t("common.save", "Save")}
      </button>
    </div>
  );
}
