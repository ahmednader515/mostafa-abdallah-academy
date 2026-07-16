"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlatformLabel } from "@/lib/types";
import { useT } from "@/components/LocaleProvider";

export function LabelsSettingsForm({ initialLabels }: { initialLabels: PlatformLabel[] }) {
  const router = useRouter();
  const t = useT();
  const [labels, setLabels] = useState<PlatformLabel[]>(initialLabels);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  function updateLabel(key: string, patch: Partial<PlatformLabel>) {
    setLabels((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLabel() {
    const key = window.prompt(t("dashboard.labelsForm.newKeyPrompt", "New label key (English, no spaces):"));
    const trimmed = key?.trim();
    if (!trimmed) return;
    if (labels.some((l) => l.key === trimmed)) {
      setError(t("dashboard.labelsForm.keyExists", "This key already exists"));
      return;
    }
    setLabels((prev) => [...prev, { key: trimmed, valueAr: "", valueEn: "", groupName: "general" }]);
  }

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings/labels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labels: labels.map((l) => ({
            key: l.key,
            valueAr: l.valueAr,
            valueEn: l.valueEn,
            groupName: l.groupName,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.labelsForm.saveFailed", "Failed to save"));
      setSuccess(t("dashboard.labelsForm.saveSuccess", "Labels saved successfully"));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.labelsForm.saveFailed", "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  const grouped = labels.reduce<Record<string, PlatformLabel[]>>((acc, l) => {
    const g = l.groupName || "general";
    acc[g] = acc[g] ?? [];
    acc[g].push(l);
    return acc;
  }, {});

  return (
    <div className="mt-6 max-w-3xl space-y-6">
      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-[var(--radius-btn)] bg-emerald-500/15 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {success}
        </div>
      ) : null}

      {Object.entries(grouped).map(([group, items]) => (
        <div
          key={group}
          className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <div className="border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">{group}</h3>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {items.map((label) => (
              <div key={label.key} className="grid gap-3 p-4 sm:grid-cols-[140px_1fr_1fr]">
                <div className="flex items-center">
                  <code className="rounded bg-[var(--color-background)] px-2 py-1 text-xs text-[var(--color-muted)]">
                    {label.key}
                  </code>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted)]">
                    {t("dashboard.labelsForm.valueAr", "Arabic")}
                  </label>
                  <input
                    type="text"
                    value={label.valueAr}
                    onChange={(e) => updateLabel(label.key, { valueAr: e.target.value })}
                    className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted)]">
                    {t("dashboard.labelsForm.valueEn", "English")}
                  </label>
                  <input
                    type="text"
                    value={label.valueEn}
                    onChange={(e) => updateLabel(label.key, { valueEn: e.target.value })}
                    dir="ltr"
                    className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addLabel}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)]"
        >
          {t("dashboard.labelsForm.addLabel", "Add label")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {saving ? t("dashboard.labelsForm.saveButtonBusy", "Saving...") : t("dashboard.labelsForm.saveButtonIdle", "Save labels")}
        </button>
      </div>
    </div>
  );
}
