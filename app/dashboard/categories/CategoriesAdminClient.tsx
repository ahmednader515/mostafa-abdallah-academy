"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

export type CategoryRow = {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  order: number;
  parentId: string | null;
  isVisible: boolean;
  isPinned: boolean;
  pinOrder: number | null;
};

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return base;
}

export function CategoriesAdminClient({ initialCategories }: { initialCategories: CategoryRow[] }) {
  const router = useRouter();
  const t = useT();
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  const [newParentId, setNewParentId] = useState("");

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  async function refresh() {
    router.refresh();
  }

  function categoryLabel(c: CategoryRow): string {
    return c.nameAr?.trim() || c.name || c.slug;
  }

  async function patchCategory(id: string, patch: Partial<CategoryRow>) {
    setError("");
    setSavingId(id);
    try {
      const res = await fetch(`/api/dashboard/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.categoriesAdmin.saveFailed", "Failed to save"));
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.categoriesAdmin.saveFailed", "Failed to save"));
    } finally {
      setSavingId(null);
    }
  }

  async function deleteCategoryRow(id: string) {
    if (!window.confirm(t("dashboard.categoriesAdmin.confirmDelete", "Delete this category?"))) return;
    setError("");
    setSavingId(id);
    try {
      const res = await fetch(`/api/dashboard/categories/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.categoriesAdmin.deleteFailed", "Failed to delete"));
      setCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.categoriesAdmin.deleteFailed", "Failed to delete"));
    } finally {
      setSavingId(null);
    }
  }

  async function createCategoryRow() {
    setError("");
    const name = newName.trim() || newNameAr.trim();
    if (!name) {
      setError(t("dashboard.categoriesAdmin.nameRequired", "A name is required"));
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/dashboard/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim() || newNameAr.trim(),
          nameAr: newNameAr.trim() || null,
          slug: slugify(newName.trim() || newNameAr.trim()),
          parentId: newParentId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.categoriesAdmin.createFailed", "Failed to create"));
      setNewName("");
      setNewNameAr("");
      setNewParentId("");
      setSuccess(t("dashboard.categoriesAdmin.createSuccess", "Category created"));
      await refresh();
      // Optimistic append so it appears immediately even without full server round-trip
      if (data.id) {
        setCategories((prev) => [
          ...prev,
          {
            id: String(data.id),
            name: newName.trim() || newNameAr.trim(),
            nameAr: newNameAr.trim() || null,
            slug: slugify(newName.trim() || newNameAr.trim()),
            order: prev.length,
            parentId: newParentId || null,
            isVisible: true,
            isPinned: false,
            pinOrder: null,
          },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.categoriesAdmin.createFailed", "Failed to create"));
    } finally {
      setCreating(false);
    }
  }

  const rootCategories = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  function renderRow(c: CategoryRow, depth: number) {
    return (
      <div key={c.id}>
        <div
          className="flex flex-wrap items-center gap-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          style={{ marginInlineStart: depth * 24 }}
        >
          <span className="min-w-[140px] flex-1 truncate text-sm font-medium text-[var(--color-foreground)]">
            {depth > 0 ? "↳ " : ""}
            {categoryLabel(c)}
          </span>
          <span className="text-xs text-[var(--color-muted)]">/{c.slug}</span>

          <select
            value={c.parentId ?? ""}
            onChange={(e) => patchCategory(c.id, { parentId: e.target.value || null })}
            disabled={savingId === c.id}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-xs"
          >
            <option value="">{t("dashboard.categoriesAdmin.noParent", "No parent (top-level)")}</option>
            {categories
              .filter((p) => p.id !== c.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {categoryLabel(p)}
                </option>
              ))}
          </select>

          <label className="flex items-center gap-1.5 text-xs text-[var(--color-foreground)]">
            <input
              type="checkbox"
              className="accent-[var(--color-primary)]"
              checked={c.isVisible}
              disabled={savingId === c.id}
              onChange={(e) => patchCategory(c.id, { isVisible: e.target.checked })}
            />
            {t("dashboard.categoriesAdmin.visible", "Visible")}
          </label>

          <label className="flex items-center gap-1.5 text-xs text-[var(--color-foreground)]">
            <input
              type="checkbox"
              className="accent-[var(--color-primary)]"
              checked={c.isPinned}
              disabled={savingId === c.id}
              onChange={(e) => patchCategory(c.id, { isPinned: e.target.checked })}
            />
            {t("dashboard.categoriesAdmin.pinned", "Pinned")}
          </label>

          <button
            type="button"
            onClick={() => deleteCategoryRow(c.id)}
            disabled={savingId === c.id}
            className="rounded-[var(--radius-btn)] border border-red-500/40 px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400"
          >
            {t("dashboard.categoriesAdmin.delete", "Delete")}
          </button>
        </div>
        {childrenOf(c.id).map((child) => renderRow(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-4xl space-y-4">
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

      <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-primary)]/50 bg-[var(--color-surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
          {t("dashboard.categoriesAdmin.newCategoryTitle", "New category")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            placeholder={t("dashboard.categoriesAdmin.namePh", "Name (English)")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder={t("dashboard.categoriesAdmin.nameArPh", "Name (Arabic)")}
            value={newNameAr}
            onChange={(e) => setNewNameAr(e.target.value)}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
          <select
            value={newParentId}
            onChange={(e) => setNewParentId(e.target.value)}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          >
            <option value="">{t("dashboard.categoriesAdmin.noParent", "No parent (top-level)")}</option>
            {categories.map((p) => (
              <option key={p.id} value={p.id}>
                {categoryLabel(p)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={createCategoryRow}
          disabled={creating}
          className="mt-3 rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
        >
          {creating
            ? t("dashboard.categoriesAdmin.creating", "Creating...")
            : t("dashboard.categoriesAdmin.create", "Create category")}
        </button>
      </div>

      <div className="space-y-2">{rootCategories.map((c) => renderRow(c, 0))}</div>
    </div>
  );
}
