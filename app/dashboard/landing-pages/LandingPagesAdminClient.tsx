"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { LANDING_TEMPLATES } from "@/lib/landing-page-templates";
import type { LandingPageListItem } from "@/lib/landing-pages-db";
import type { LandingTemplateId } from "@/lib/landing-page-types";

export function LandingPagesAdminClient({
  initialPages,
}: {
  initialPages: LandingPageListItem[];
}) {
  const t = useT();
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [internalName, setInternalName] = useState("");
  const [templateId, setTemplateId] = useState<LandingTemplateId>("course");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const orderedIds = useMemo(() => pages.map((p) => p.id), [pages]);

  async function reload() {
    const r = await fetch("/api/dashboard/landing-pages", { credentials: "include" });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setPages(d.pages ?? []);
  }

  async function create() {
    setError("");
    setBusy(true);
    const r = await fetch("/api/dashboard/landing-pages", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalName: internalName.trim() || undefined, templateId }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setError(d.error ?? t("landingPages.createFailed", "Failed to create page"));
      return;
    }
    setInternalName("");
    await reload();
    if (d.page?.id) router.push(`/dashboard/landing-pages/${d.page.id}`);
  }

  async function patch(id: string, data: object) {
    setBusy(true);
    await fetch(`/api/dashboard/landing-pages/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    await reload();
  }

  async function duplicate(id: string) {
    setBusy(true);
    const r = await fetch(`/api/dashboard/landing-pages/${id}/duplicate`, {
      method: "POST",
      credentials: "include",
    });
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error ?? t("landingPages.duplicateFailed", "Failed to duplicate"));
      return;
    }
    await reload();
  }

  async function remove(id: string) {
    if (!window.confirm(t("common.confirmDelete", "Delete this item?"))) return;
    setBusy(true);
    await fetch(`/api/dashboard/landing-pages/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setBusy(false);
    await reload();
  }

  async function move(index: number, direction: "up" | "down") {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= orderedIds.length || busy) return;
    const next = [...orderedIds];
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    setBusy(true);
    await fetch("/api/dashboard/landing-pages/reorder", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next }),
    });
    setBusy(false);
    await reload();
  }

  return (
    <div className="mt-6 space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="text-sm font-semibold">
          {t("landingPages.createTitle", "Create landing page")}
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            value={internalName}
            onChange={(e) => setInternalName(e.target.value)}
            placeholder={t("landingPages.internalName", "Internal name")}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as LandingTemplateId)}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            {LANDING_TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.nameAr} / {tpl.nameEn}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => void create()}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {t("landingPages.create", "Create")}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {pages.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {t("landingPages.empty", "No landing pages yet.")}
          </p>
        ) : null}
        {pages.map((page, index) => {
          const conversion =
            page.stats.visits > 0
              ? Math.round((page.stats.purchases / page.stats.visits) * 1000) / 10
              : 0;
          return (
            <div
              key={page.id}
              className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{page.internalName}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      page.isPublished
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {page.isPublished
                      ? t("landingPages.published", "Published")
                      : t("landingPages.draft", "Draft")}
                  </span>
                  {!page.isVisible ? (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {t("landingPages.hidden", "Hidden")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-sm text-[var(--color-muted)]" dir="ltr">
                  /l/{page.slug}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {t("landingPages.visits", "Visits")}: {page.stats.visits} ·{" "}
                  {t("landingPages.ctaClicks", "CTA clicks")}: {page.stats.ctaClicks} ·{" "}
                  {t("landingPages.purchases", "Purchases")}: {page.stats.purchases} ·{" "}
                  {t("landingPages.conversion", "Conversion")}: {conversion}%
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <button
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => void move(index, "up")}
                  className="rounded border px-2 py-1 disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={busy || index === pages.length - 1}
                  onClick={() => void move(index, "down")}
                  className="rounded border px-2 py-1 disabled:opacity-40"
                >
                  ↓
                </button>
                <Link
                  href={`/dashboard/landing-pages/${page.id}`}
                  className="rounded border px-3 py-1 underline"
                >
                  {t("common.edit", "Edit")}
                </Link>
                <Link
                  href={`/l/${page.slug}${page.isPublished ? "" : "?preview=1"}`}
                  target="_blank"
                  className="rounded border px-3 py-1 underline"
                >
                  {t("landingPages.preview", "Preview")}
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void patch(page.id, { isPublished: !page.isPublished })}
                  className="rounded border px-3 py-1"
                >
                  {page.isPublished
                    ? t("landingPages.unpublish", "Unpublish")
                    : t("landingPages.publish", "Publish")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void patch(page.id, { isVisible: !page.isVisible })}
                  className="rounded border px-3 py-1"
                >
                  {page.isVisible
                    ? t("landingPages.hide", "Hide")
                    : t("landingPages.show", "Show")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void duplicate(page.id)}
                  className="rounded border px-3 py-1"
                >
                  {t("landingPages.duplicate", "Duplicate")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove(page.id)}
                  className="rounded border px-3 py-1 text-red-600"
                >
                  {t("common.delete", "Delete")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
