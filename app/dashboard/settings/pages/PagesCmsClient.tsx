"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import type { PolicyCard } from "@/lib/policy-cards";

export function PagesCmsClient() {
  const t = useT();
  const [cards, setCards] = useState<PolicyCard[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/settings/pages")
      .then((r) => r.json())
      .then((d) => setCards(d.cards ?? []))
      .catch(() => undefined);
  }, []);

  function updateCard(index: number, patch: Partial<PolicyCard>) {
    setCards((list) => list.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    const res = await fetch("/api/dashboard/settings/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed");
      return;
    }
    setMsg(t("dashboard.pagesCms.saved", "Saved"));
  }

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-6">
      {cards.map((card, index) => (
        <div key={card.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">{card.slug}</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={card.isVisible}
                onChange={(e) => updateCard(index, { isVisible: e.target.checked })}
              />
              Visible
            </label>
          </div>
          <input
            value={card.titleAr}
            onChange={(e) => updateCard(index, { titleAr: e.target.value })}
            placeholder="Title AR"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={card.titleEn}
            onChange={(e) => updateCard(index, { titleEn: e.target.value })}
            placeholder="Title EN"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={card.bodyAr}
            onChange={(e) => updateCard(index, { bodyAr: e.target.value })}
            rows={4}
            placeholder="Body AR"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={card.bodyEn}
            onChange={(e) => updateCard(index, { bodyEn: e.target.value })}
            rows={4}
            placeholder="Body EN"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </div>
      ))}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
      <button type="submit" className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white">
        {t("dashboard.pagesCms.save", "Save pages")}
      </button>
    </form>
  );
}
