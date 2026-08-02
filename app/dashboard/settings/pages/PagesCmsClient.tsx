"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/LocaleProvider";
import {
  RESERVED_POLICY_SLUGS,
  sanitizePolicySlug,
  type PolicyCard,
  type PolicyPlacement,
  type PolicyStatus,
} from "@/lib/policy-cards";

function newCard(order: number): PolicyCard {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `page-${Date.now()}`;
  return {
    id,
    slug: `page-${order + 1}`,
    titleAr: "",
    titleEn: "",
    bodyAr: "",
    bodyEn: "",
    icon: null,
    link: `/page-${order + 1}`,
    isVisible: false,
    status: "draft",
    placement: "footer",
    order,
  };
}

export function PagesCmsClient() {
  const t = useT();
  const [cards, setCards] = useState<PolicyCard[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/settings/pages")
      .then((r) => r.json())
      .then((d) => setCards(d.cards ?? []))
      .catch(() => undefined);
  }, []);

  function updateCard(index: number, patch: Partial<PolicyCard>) {
    setCards((list) =>
      list.map((c, i) => {
        if (i !== index) return c;
        const next = { ...c, ...patch };
        if (patch.slug !== undefined) {
          const slug = sanitizePolicySlug(patch.slug) || c.slug;
          next.slug = slug;
          next.link = `/${slug}`;
        }
        if (patch.status !== undefined) {
          next.isVisible = patch.status === "published";
        }
        return next;
      }),
    );
  }

  function addPage() {
    setCards((list) => [...list, newCard(list.length)]);
    setMsg("");
    setError("");
  }

  function removePage(index: number) {
    const card = cards[index];
    const ok = window.confirm(
      t("pagesCms.confirmDelete", "Delete this page?") +
        (card?.titleAr || card?.titleEn || card?.slug ? ` (${card.titleAr || card.titleEn || card.slug})` : ""),
    );
    if (!ok) return;
    setCards((list) => list.filter((_, i) => i !== index).map((c, i) => ({ ...c, order: i })));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    const slugs = cards.map((c) => sanitizePolicySlug(c.slug));
    if (slugs.some((s) => !s)) {
      setError(t("pagesCms.slugRequired", "Each page needs a valid slug."));
      return;
    }
    if (new Set(slugs).size !== slugs.length) {
      setError(t("pagesCms.slugDuplicate", "Slug must be unique."));
      return;
    }
    const reserved = slugs.find((s) => RESERVED_POLICY_SLUGS.has(s));
    if (reserved) {
      setError(
        t("pagesCms.slugReserved", "Slug is reserved: {slug}").replace("{slug}", reserved),
      );
      return;
    }
    setSaving(true);
    const payload = cards.map((c, i) => ({
      ...c,
      slug: sanitizePolicySlug(c.slug),
      link: `/${sanitizePolicySlug(c.slug)}`,
      order: i,
      isVisible: c.status === "published",
    }));
    const res = await fetch("/api/dashboard/settings/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards: payload }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t("pagesCms.saveFailed", "Save failed"));
      return;
    }
    setCards(payload);
    setMsg(t("pagesCms.saved", "Saved"));
  }

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-[var(--color-muted)]">
          {t(
            "pagesCms.intro",
            "Create pages (privacy, terms, …). Published pages appear automatically in the header/footer/homepage according to placement. Draft pages stay hidden from visitors.",
          )}
        </p>
        <button
          type="button"
          onClick={addPage}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm font-semibold"
        >
          {t("pagesCms.addPage", "Add page")}
        </button>
      </div>

      {cards.map((card, index) => {
        const href = `/${sanitizePolicySlug(card.slug) || card.slug}`;
        return (
          <div
            key={card.id}
            className="space-y-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-[var(--color-foreground)]">
                {card.titleAr || card.titleEn || card.slug || t("pagesCms.newPage", "New page")}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {card.status === "published" ? (
                  <Link
                    href={href}
                    target="_blank"
                    className="text-xs font-semibold text-[var(--color-primary)] underline"
                  >
                    {href}
                  </Link>
                ) : (
                  <span className="text-xs text-[var(--color-muted)]">{href}</span>
                )}
                <button
                  type="button"
                  onClick={() => removePage(index)}
                  className="rounded border border-red-500/40 px-2 py-1 text-xs font-semibold text-red-600"
                >
                  {t("pagesCms.delete", "Delete")}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">
                  {t("pagesCms.slug", "URL slug")}
                </label>
                <input
                  value={card.slug}
                  onChange={(e) => updateCard(index, { slug: e.target.value })}
                  placeholder="privacy"
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">
                  {t("pagesCms.status", "Status")}
                </label>
                <select
                  value={card.status}
                  onChange={(e) =>
                    updateCard(index, { status: e.target.value as PolicyStatus })
                  }
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                >
                  <option value="draft">{t("pagesCms.statusDraft", "Draft")}</option>
                  <option value="published">{t("pagesCms.statusPublished", "Published")}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[var(--color-muted)]">
                  {t("pagesCms.placement", "Show in")}
                </label>
                <select
                  value={card.placement}
                  onChange={(e) =>
                    updateCard(index, { placement: e.target.value as PolicyPlacement })
                  }
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                >
                  <option value="header">{t("pagesCms.placementHeader", "Header")}</option>
                  <option value="footer">{t("pagesCms.placementFooter", "Footer")}</option>
                  <option value="both">{t("pagesCms.placementBoth", "Header & Footer")}</option>
                  <option value="none">{t("pagesCms.placementNone", "Homepage section only")}</option>
                </select>
              </div>
            </div>

            <input
              value={card.titleAr}
              onChange={(e) => updateCard(index, { titleAr: e.target.value })}
              placeholder={t("pagesCms.titleAr", "Title (Arabic)")}
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
            <input
              value={card.titleEn}
              onChange={(e) => updateCard(index, { titleEn: e.target.value })}
              placeholder={t("pagesCms.titleEn", "Title (English)")}
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
            <textarea
              value={card.bodyAr}
              onChange={(e) => updateCard(index, { bodyAr: e.target.value })}
              rows={4}
              placeholder={t("pagesCms.bodyAr", "Body (Arabic)")}
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
            <textarea
              value={card.bodyEn}
              onChange={(e) => updateCard(index, { bodyEn: e.target.value })}
              rows={4}
              placeholder={t("pagesCms.bodyEn", "Body (English)")}
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </div>
        );
      })}

      {cards.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          {t("pagesCms.empty", "No pages yet. Add a page to get started.")}
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {saving ? t("pagesCms.saving", "Saving…") : t("pagesCms.save", "Save pages")}
      </button>
    </form>
  );
}
