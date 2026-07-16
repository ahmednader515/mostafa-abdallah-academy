"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HomepageSetting } from "@/lib/types";
import { useT } from "@/components/LocaleProvider";

/** نصوص الصفحة المشتركة + واتساب (وسائل الدفع تُدار في PaymentMethodsAdmin) */
export function AddBalanceSettingsForm({ initialSettings }: { initialSettings: HomepageSetting }) {
  const router = useRouter();
  const t = useT();
  const Ab = "dashboard.addBalanceSettings";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    addBalanceTitle: initialSettings.addBalanceTitle ?? "",
    addBalanceTitleEn: initialSettings.addBalanceTitleEn ?? "",
    addBalanceSubtitle: initialSettings.addBalanceSubtitle ?? "",
    addBalanceSubtitleEn: initialSettings.addBalanceSubtitleEn ?? "",
    addBalanceConfirmationNote: initialSettings.addBalanceConfirmationNote ?? "",
    addBalanceConfirmationNoteEn: initialSettings.addBalanceConfirmationNoteEn ?? "",
    addBalanceWhatsappNumber: initialSettings.addBalanceWhatsappNumber ?? "",
    addBalanceWhatsappButtonText: initialSettings.addBalanceWhatsappButtonText ?? "",
    addBalanceWhatsappButtonTextEn: initialSettings.addBalanceWhatsappButtonTextEn ?? "",
    addBalanceWaitingNote: initialSettings.addBalanceWaitingNote ?? "",
    addBalanceWaitingNoteEn: initialSettings.addBalanceWaitingNoteEn ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/dashboard/settings/add-balance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t(`${Ab}.saveFailed`));
      setSuccess(t(`${Ab}.saveSuccess`));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(`${Ab}.genericError`));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-3xl space-y-6">
      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-[var(--radius-btn)] bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
          {success}
        </div>
      ) : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="space-y-4">
          <input
            value={form.addBalanceTitle}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceTitle: e.target.value }))}
            placeholder={t(`${Ab}.phTitleAr`, "Page title (Arabic)")}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceTitleEn}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceTitleEn: e.target.value }))}
            placeholder={t(`${Ab}.phTitleEn`, "Page title (English)")}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceSubtitle}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceSubtitle: e.target.value }))}
            placeholder={t(`${Ab}.phSubtitleAr`, "Subtitle (Arabic)")}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceSubtitleEn}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceSubtitleEn: e.target.value }))}
            placeholder={t(`${Ab}.phSubtitleEn`, "Subtitle (English)")}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={form.addBalanceConfirmationNote}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceConfirmationNote: e.target.value }))}
            placeholder={t(`${Ab}.phConfirmationAr`, "WhatsApp confirmation note (Arabic)")}
            rows={2}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={form.addBalanceConfirmationNoteEn}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceConfirmationNoteEn: e.target.value }))}
            placeholder={t(`${Ab}.phConfirmationEn`, "WhatsApp confirmation note (English)")}
            rows={2}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceWhatsappNumber}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWhatsappNumber: e.target.value }))}
            placeholder={t(`${Ab}.phWhatsapp`, "WhatsApp number")}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceWhatsappButtonText}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWhatsappButtonText: e.target.value }))}
            placeholder={t(`${Ab}.phWhatsappBtnAr`, "WhatsApp button text (Arabic)")}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <input
            value={form.addBalanceWhatsappButtonTextEn}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWhatsappButtonTextEn: e.target.value }))}
            placeholder={t(`${Ab}.phWhatsappBtnEn`, "WhatsApp button text (English)")}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={form.addBalanceWaitingNote}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWaitingNote: e.target.value }))}
            placeholder={t(`${Ab}.phWaitingNoteAr`, "Waiting note (Arabic)")}
            rows={3}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <textarea
            value={form.addBalanceWaitingNoteEn}
            onChange={(e) => setForm((f) => ({ ...f, addBalanceWaitingNoteEn: e.target.value }))}
            placeholder={t(`${Ab}.phWaitingNoteEn`, "Waiting note (English)")}
            rows={3}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-2 font-medium text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {saving ? t(`${Ab}.saving`) : t(`${Ab}.saveIdle`)}
      </button>
    </form>
  );
}
