"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { ForumCategoryIcon } from "@/components/ForumCategoryIcon";
import { useT } from "@/components/LocaleProvider";
import {
  FORUM_AUDIENCES,
  FORUM_CATEGORY_ICONS,
  type ForumAudience,
  type ForumCategory,
  type ForumThread,
} from "@/lib/forum-shared";

type CatForm = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  color: string;
  isVisible: boolean;
  isLocked: boolean;
  isPinned: boolean;
  isDefault: boolean;
  viewAudience: ForumAudience;
  createAudience: ForumAudience;
};

const emptyForm = (): CatForm => ({
  name: "",
  nameAr: "",
  description: "",
  descriptionAr: "",
  icon: "chat",
  color: "#0056D2",
  isVisible: true,
  isLocked: false,
  isPinned: false,
  isDefault: false,
  viewAudience: "public",
  createAudience: "logged_in",
});

function formFromCategory(c: ForumCategory): CatForm {
  return {
    name: c.name,
    nameAr: c.nameAr ?? "",
    description: c.description ?? "",
    descriptionAr: c.descriptionAr ?? "",
    icon: c.icon || "chat",
    color: c.color || "#0056D2",
    isVisible: c.isVisible,
    isLocked: c.isLocked,
    isPinned: c.isPinned,
    isDefault: c.isDefault,
    viewAudience: c.viewAudience,
    createAudience: c.createAudience,
  };
}

function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: ForumCategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3"
    >
      <button
        type="button"
        className="cursor-grab rounded border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-muted)] active:cursor-grabbing"
        aria-label={t("dashboard.forum.dragHandle", "Drag to reorder")}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: category.color || "#0056D2" }}
      >
        <ForumCategoryIcon name={category.icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--color-foreground)]">
          {category.nameAr || category.name}
          {category.nameAr && category.name ? (
            <span className="ms-2 text-xs font-normal text-[var(--color-muted)]">{category.name}</span>
          ) : null}
        </p>
        <p className="mt-0.5 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
          <span>{category.threadCount ?? 0} {t("dashboard.forum.threads", "threads")}</span>
          {!category.isVisible ? (
            <span className="rounded bg-slate-100 px-1.5 py-0.5">{t("dashboard.forum.hidden", "Hidden")}</span>
          ) : null}
          {category.isLocked ? (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
              {t("dashboard.forum.locked", "Locked")}
            </span>
          ) : null}
          {category.isPinned ? (
            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">
              {t("dashboard.forum.pinned", "Pinned")}
            </span>
          ) : null}
          {category.isDefault ? (
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
              {t("dashboard.forum.default", "Default")}
            </span>
          ) : null}
        </p>
      </div>
      <div className="flex gap-2 text-sm">
        <button type="button" onClick={onEdit} className="text-[var(--color-primary)] underline">
          {t("dashboard.forum.edit", "Edit")}
        </button>
        <button type="button" onClick={onDelete} className="text-red-600 underline">
          {t("dashboard.forum.delete", "Delete")}
        </button>
      </div>
    </div>
  );
}

export function ForumAdminClient({
  initialCategories,
  initialThreads,
}: {
  initialCategories: ForumCategory[];
  initialThreads: ForumThread[];
}) {
  const t = useT();
  const [tab, setTab] = useState<"categories" | "threads">("categories");
  const [categories, setCategories] = useState(initialCategories);
  const [threads, setThreads] = useState(initialThreads);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<CatForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ForumCategory | null>(null);
  const [deleteMode, setDeleteMode] = useState<"block" | "move">("block");
  const [moveToId, setMoveToId] = useState("");
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filteredThreads = useMemo(
    () =>
      threads
        .filter((thread) =>
          `${thread.title} ${thread.body} ${thread.authorName ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [threads, query],
  );

  const audienceLabel = (a: ForumAudience) =>
    t(`dashboard.forum.audience.${a}`, a.replace("_", " "));

  function patchForm<K extends keyof CatForm>(key: K, value: CatForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  }

  function startEdit(c: ForumCategory) {
    setEditingId(c.id);
    setForm(formFromCategory(c));
    setError("");
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        nameAr: form.nameAr || null,
        description: form.description || null,
        descriptionAr: form.descriptionAr || null,
      };
      const url = editingId
        ? `/api/dashboard/forum/categories/${encodeURIComponent(editingId)}`
        : "/api/dashboard/forum/categories";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("dashboard.forum.saveFailed", "Save failed"));
      const category = data.category as ForumCategory;
      setCategories((list) => {
        const next = editingId
          ? list.map((c) => (c.id === editingId ? { ...c, ...category } : c))
          : [...list, category];
        return category.isDefault
          ? next.map((c) => ({ ...c, isDefault: c.id === category.id }))
          : next;
      });
      startCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.forum.saveFailed", "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(categories, oldIndex, newIndex);
    setCategories(next);
    const orderedIds = next.map((c) => c.id);
    const res = await fetch("/api/dashboard/forum/categories/reorder", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    if (!res.ok) {
      setCategories(categories);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/dashboard/forum/categories/${encodeURIComponent(deleteTarget.id)}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: deleteMode,
            moveToCategoryId: deleteMode === "move" ? moveToId : undefined,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("dashboard.forum.deleteFailed", "Delete failed"));
      setCategories((list) => list.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.forum.deleteFailed", "Delete failed"));
    } finally {
      setDeleting(false);
    }
  }

  async function patchThread(id: string, patch: Record<string, boolean>) {
    const r = await fetch(`/api/forum/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (r.ok) {
      setThreads((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                ...Object.fromEntries(
                  Object.entries(patch).map(([key, value]) => [
                    key === "pinned" ? "isPinned" : "isLocked",
                    value,
                  ]),
                ),
              }
            : item,
        ),
      );
    }
  }

  async function removeThread(id: string) {
    if (!window.confirm(t("forum.confirmDelete", "Delete this thread?"))) return;
    const r = await fetch(`/api/forum/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) setThreads((items) => items.filter((item) => item.id !== id));
  }

  const moveOptions = categories.filter((c) => c.id !== deleteTarget?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("categories")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "categories"
              ? "bg-[var(--color-primary)] text-white"
              : "border border-[var(--color-border)]"
          }`}
        >
          {t("dashboard.forum.categoriesTab", "Categories")}
        </button>
        <button
          type="button"
          onClick={() => setTab("threads")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "threads"
              ? "bg-[var(--color-primary)] text-white"
              : "border border-[var(--color-border)]"
          }`}
        >
          {t("dashboard.forum.threadsTab", "Threads")}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {tab === "categories" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{t("dashboard.forum.manageCategories", "Manage categories")}</h3>
              <button
                type="button"
                onClick={startCreate}
                className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white"
              >
                + {t("dashboard.forum.newCategory", "New category")}
              </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void onDragEnd(e)}>
              <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <SortableCategoryRow
                      key={category.id}
                      category={category}
                      onEdit={() => startEdit(category)}
                      onDelete={() => {
                        setDeleteTarget(category);
                        setDeleteMode((category.threadCount ?? 0) > 0 ? "block" : "block");
                        setMoveToId(moveOptions[0]?.id ?? "");
                        setError("");
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {categories.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                {t("dashboard.forum.noCategories", "No categories yet.")}
              </p>
            ) : null}
          </div>

          <form
            onSubmit={(e) => void saveCategory(e)}
            className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <h3 className="font-semibold">
              {editingId
                ? t("dashboard.forum.editCategory", "Edit category")
                : t("dashboard.forum.createCategory", "Create category")}
            </h3>
            <input
              required
              value={form.name}
              onChange={(e) => patchForm("name", e.target.value)}
              placeholder={t("dashboard.forum.nameEn", "Name (EN)")}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            />
            <input
              value={form.nameAr}
              onChange={(e) => patchForm("nameAr", e.target.value)}
              placeholder={t("dashboard.forum.nameAr", "Name (AR)")}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            />
            <textarea
              value={form.description}
              onChange={(e) => patchForm("description", e.target.value)}
              placeholder={t("dashboard.forum.descriptionEn", "Short description (EN)")}
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            />
            <textarea
              value={form.descriptionAr}
              onChange={(e) => patchForm("descriptionAr", e.target.value)}
              placeholder={t("dashboard.forum.descriptionAr", "Short description (AR)")}
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            />

            <div>
              <p className="mb-1 text-xs font-medium text-[var(--color-muted)]">
                {t("dashboard.forum.icon", "Icon")}
              </p>
              <div className="flex flex-wrap gap-2">
                {FORUM_CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => patchForm("icon", icon)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
                      form.icon === icon
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-[var(--color-border)]"
                    }`}
                  >
                    <ForumCategoryIcon name={icon} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <span>{t("dashboard.forum.color", "Color")}</span>
              <input
                type="color"
                value={form.color}
                onChange={(e) => patchForm("color", e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border border-[var(--color-border)]"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>{t("dashboard.forum.viewAudience", "Who can view")}</span>
              <select
                value={form.viewAudience}
                onChange={(e) => patchForm("viewAudience", e.target.value as ForumAudience)}
                className="rounded-lg border border-[var(--color-border)] px-3 py-2"
              >
                {FORUM_AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {audienceLabel(a)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>{t("dashboard.forum.createAudience", "Who can create topics")}</span>
              <select
                value={form.createAudience}
                onChange={(e) => patchForm("createAudience", e.target.value as ForumAudience)}
                className="rounded-lg border border-[var(--color-border)] px-3 py-2"
              >
                {FORUM_AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {audienceLabel(a)}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isVisible}
                  onChange={(e) => patchForm("isVisible", e.target.checked)}
                />
                {t("dashboard.forum.visible", "Visible")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isLocked}
                  onChange={(e) => patchForm("isLocked", e.target.checked)}
                />
                {t("dashboard.forum.lockCategory", "Locked")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => patchForm("isPinned", e.target.checked)}
                />
                {t("dashboard.forum.pinCategory", "Pin to top")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => patchForm("isDefault", e.target.checked)}
                />
                {t("dashboard.forum.setDefault", "Default category")}
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? t("dashboard.forum.saving", "Saving…")
                  : editingId
                    ? t("dashboard.forum.save", "Save")
                    : t("dashboard.forum.create", "Create")}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={startCreate}
                  className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm"
                >
                  {t("dashboard.forum.cancel", "Cancel")}
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold">{t("forum.adminTitle", "Forum moderation")}</h3>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("forum.search", "Search threads")}
            className="w-full rounded border px-3 py-2"
          />
          <div className="space-y-3">
            {filteredThreads.map((thread) => (
              <div key={thread.id} className="rounded border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{thread.title}</h3>
                    <p className="text-sm text-[var(--color-muted)]">
                      {thread.categoryName} · {thread.authorName} ·{" "}
                      {new Date(thread.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => void patchThread(thread.id, { pinned: !thread.isPinned })}
                      className="underline"
                    >
                      {thread.isPinned ? t("forum.unpin", "Unpin") : t("forum.pin", "Pin")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void patchThread(thread.id, { locked: !thread.isLocked })}
                      className="underline"
                    >
                      {thread.isLocked ? t("forum.unlock", "Unlock") : t("forum.lock", "Lock")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeThread(thread.id)}
                      className="text-red-600 underline"
                    >
                      {t("forum.delete", "Delete")}
                    </button>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm">{thread.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold">
              {t("dashboard.forum.deleteCategoryTitle", "Delete category")}
            </h3>
            <p className="text-sm text-[var(--color-muted)]">
              {t(
                "dashboard.forum.deleteCategoryHint",
                "If this category has topics, choose whether to block deletion or move them first.",
              )}
            </p>
            <p className="text-sm font-medium">
              {deleteTarget.nameAr || deleteTarget.name} · {deleteTarget.threadCount ?? 0}{" "}
              {t("dashboard.forum.threads", "threads")}
            </p>
            {(deleteTarget.threadCount ?? 0) > 0 ? (
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={deleteMode === "block"}
                    onChange={() => setDeleteMode("block")}
                  />
                  {t("dashboard.forum.deleteBlock", "Block delete while topics exist")}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={deleteMode === "move"}
                    onChange={() => setDeleteMode("move")}
                  />
                  {t("dashboard.forum.deleteMove", "Move topics then delete")}
                </label>
                {deleteMode === "move" ? (
                  <select
                    value={moveToId}
                    onChange={(e) => setMoveToId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2"
                  >
                    {moveOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr || c.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                {t("dashboard.forum.deleteEmpty", "This category has no topics and can be deleted.")}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                {t("dashboard.forum.cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={
                  deleting ||
                  ((deleteTarget.threadCount ?? 0) > 0 &&
                    deleteMode === "block") ||
                  ((deleteTarget.threadCount ?? 0) > 0 && deleteMode === "move" && !moveToId)
                }
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting
                  ? t("dashboard.forum.deleting", "Deleting…")
                  : t("dashboard.forum.delete", "Delete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
