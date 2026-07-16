"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { HomepageSection } from "@/lib/types";
import { useT } from "@/components/LocaleProvider";

export function HomepageSectionsForm({ initialSections }: { initialSections: HomepageSection[] }) {
  const router = useRouter();
  const t = useT();
  const [sections, setSections] = useState<HomepageSection[]>(initialSections);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  function updateSection(id: string, patch: Partial<HomepageSection>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function move(id: string, dir: -1 | 1) {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/homepage-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: sections.map((s) => ({
            id: s.id,
            sectionType: s.sectionType,
            title: s.title,
            titleEn: s.titleEn,
            icon: s.icon,
            configJson: s.configJson,
            order: s.order,
            isVisible: s.isVisible,
            isPinned: s.isPinned,
          })),
          order: sections.map((s) => s.id),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.homepageSectionsForm.saveFailed", "Failed to save"));
      if (Array.isArray(data.sections)) setSections(data.sections);
      setSuccess(t("dashboard.homepageSectionsForm.saveSuccess", "Sections saved successfully"));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.homepageSectionsForm.saveFailed", "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 max-w-3xl space-y-4">
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

      <div className="space-y-3">
        {sections.map((s, idx) => (
          <div
            key={s.id}
            className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="rounded-full bg-[var(--color-background)] px-2.5 py-1 text-xs font-semibold text-[var(--color-muted)]">
                {s.sectionType}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(s.id, -1)}
                  disabled={idx === 0}
                  className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs font-semibold disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(s.id, 1)}
                  disabled={idx === sections.length - 1}
                  className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs font-semibold disabled:opacity-40"
                >
                  ↓
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.homepageSectionsForm.titleAr", "Title (Arabic)")}
                </label>
                <input
                  type="text"
                  value={s.title ?? ""}
                  onChange={(e) => updateSection(s.id, { title: e.target.value })}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.homepageSectionsForm.titleEn", "Title (English)")}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={s.titleEn ?? ""}
                  onChange={(e) => updateSection(s.id, { titleEn: e.target.value })}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
                <input
                  type="checkbox"
                  className="accent-[var(--color-primary)]"
                  checked={s.isVisible}
                  onChange={(e) => updateSection(s.id, { isVisible: e.target.checked })}
                />
                {t("dashboard.homepageSectionsForm.visible", "Visible")}
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
                <input
                  type="checkbox"
                  className="accent-[var(--color-primary)]"
                  checked={s.isPinned}
                  onChange={(e) => updateSection(s.id, { isPinned: e.target.checked })}
                />
                {t("dashboard.homepageSectionsForm.pinned", "Pinned to top")}
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {saving
          ? t("dashboard.homepageSectionsForm.saveButtonBusy", "Saving...")
          : t("dashboard.homepageSectionsForm.saveButtonIdle", "Save sections")}
      </button>
    </div>
  );
}
