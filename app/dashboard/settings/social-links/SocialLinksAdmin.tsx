"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SocialLink } from "@/lib/types";
import { useT } from "@/components/LocaleProvider";

const NETWORK_OPTIONS = ["whatsapp", "facebook", "telegram", "youtube", "linkedin", "instagram", "tiktok", "x"];

type DraftLink = {
  network: string;
  label: string;
  labelEn: string;
  url: string;
  isEnabled: boolean;
  order: number;
};

function emptyDraft(): DraftLink {
  return { network: "whatsapp", label: "", labelEn: "", url: "", isEnabled: true, order: 0 };
}

export function SocialLinksAdmin({ initialLinks }: { initialLinks: SocialLink[] }) {
  const router = useRouter();
  const t = useT();
  const [links, setLinks] = useState<SocialLink[]>(initialLinks);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState<DraftLink>(emptyDraft());
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  function updateLink(id: string, patch: Partial<SocialLink>) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function refresh() {
    try {
      const res = await fetch("/api/dashboard/social-links");
      const data = await res.json();
      if (res.ok && Array.isArray(data.links)) setLinks(data.links);
    } catch {
      /* ignore */
    }
    router.refresh();
  }

  async function saveLink(l: SocialLink) {
    setError("");
    setSuccess("");
    setSavingId(l.id);
    try {
      const res = await fetch(`/api/dashboard/social-links/${l.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network: l.network,
          label: l.label,
          labelEn: l.labelEn,
          url: l.url,
          isEnabled: l.isEnabled,
          order: l.order,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.socialLinksAdmin.saveFailed", "Failed to save"));
      setSuccess(t("dashboard.socialLinksAdmin.saveSuccess", "Saved successfully"));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.socialLinksAdmin.saveFailed", "Failed to save"));
    } finally {
      setSavingId(null);
    }
  }

  async function deleteLink(id: string) {
    if (!window.confirm(t("dashboard.socialLinksAdmin.confirmDelete", "Delete this link?"))) return;
    setError("");
    setSavingId(id);
    try {
      const res = await fetch(`/api/dashboard/social-links/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.socialLinksAdmin.deleteFailed", "Failed to delete"));
      setLinks((prev) => prev.filter((l) => l.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.socialLinksAdmin.deleteFailed", "Failed to delete"));
    } finally {
      setSavingId(null);
    }
  }

  async function createLink() {
    setError("");
    if (!newLink.url.trim()) {
      setError(t("dashboard.socialLinksAdmin.urlRequired", "URL is required"));
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/dashboard/social-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLink),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.socialLinksAdmin.createFailed", "Failed to create"));
      setNewLink(emptyDraft());
      setShowNewForm(false);
      setSuccess(t("dashboard.socialLinksAdmin.createSuccess", "Link created"));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.socialLinksAdmin.createFailed", "Failed to create"));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mt-6 max-w-2xl space-y-4">
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
        {links.map((l) => (
          <div
            key={l.id}
            className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.socialLinksAdmin.network", "Network")}
                </label>
                <select
                  value={l.network}
                  onChange={(e) => updateLink(l.id, { network: e.target.value })}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                >
                  {NETWORK_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.socialLinksAdmin.order", "Order")}
                </label>
                <input
                  type="number"
                  value={l.order}
                  onChange={(e) => updateLink(l.id, { order: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.socialLinksAdmin.url", "URL")}
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={l.url}
                  onChange={(e) => updateLink(l.id, { url: e.target.value })}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.socialLinksAdmin.labelAr", "Label (Arabic)")}
                </label>
                <input
                  type="text"
                  value={l.label ?? ""}
                  onChange={(e) => updateLink(l.id, { label: e.target.value })}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.socialLinksAdmin.labelEn", "Label (English)")}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={l.labelEn ?? ""}
                  onChange={(e) => updateLink(l.id, { labelEn: e.target.value })}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
                <input
                  type="checkbox"
                  className="accent-[var(--color-primary)]"
                  checked={l.isEnabled}
                  onChange={(e) => updateLink(l.id, { isEnabled: e.target.checked })}
                />
                {t("dashboard.socialLinksAdmin.enabled", "Enabled")}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => deleteLink(l.id)}
                  disabled={savingId === l.id}
                  className="rounded-[var(--radius-btn)] border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400"
                >
                  {t("dashboard.socialLinksAdmin.delete", "Delete")}
                </button>
                <button
                  type="button"
                  onClick={() => saveLink(l)}
                  disabled={savingId === l.id}
                  className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50"
                >
                  {savingId === l.id
                    ? t("dashboard.socialLinksAdmin.saving", "Saving...")
                    : t("dashboard.socialLinksAdmin.save", "Save")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNewForm ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-primary)]/50 bg-[var(--color-surface)] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={newLink.network}
              onChange={(e) => setNewLink((f) => ({ ...f, network: e.target.value }))}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            >
              {NETWORK_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <input
              type="url"
              dir="ltr"
              placeholder={t("dashboard.socialLinksAdmin.urlPh", "https://...")}
              value={newLink.url}
              onChange={(e) => setNewLink((f) => ({ ...f, url: e.target.value }))}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder={t("dashboard.socialLinksAdmin.labelArPh", "Label (Arabic)")}
              value={newLink.label}
              onChange={(e) => setNewLink((f) => ({ ...f, label: e.target.value }))}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder={t("dashboard.socialLinksAdmin.labelEnPh", "Label (English)")}
              value={newLink.labelEn}
              onChange={(e) => setNewLink((f) => ({ ...f, labelEn: e.target.value }))}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={createLink}
              disabled={creating}
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {creating
                ? t("dashboard.socialLinksAdmin.creating", "Creating...")
                : t("dashboard.socialLinksAdmin.create", "Create")}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)]"
            >
              {t("dashboard.socialLinksAdmin.cancel", "Cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          className="rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-primary)]"
        >
          {t("dashboard.socialLinksAdmin.addLink", "Add social link")}
        </button>
      )}
    </div>
  );
}
