"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentMethod } from "@/lib/types";
import { useT } from "@/components/LocaleProvider";

type DraftMethod = {
  id?: string;
  type: string;
  name: string;
  nameAr: string;
  accountDetails: string;
  instructions: string;
  instructionsEn: string;
  isEnabled: boolean;
  order: number;
};

const KNOWN_TYPES = [
  { value: "vodafone_cash", labelAr: "فودافون كاش", labelEn: "Vodafone Cash" },
  { value: "orange_cash", labelAr: "أورنج كاش", labelEn: "Orange Cash" },
  { value: "etisalat_cash", labelAr: "اتصالات كاش", labelEn: "Etisalat Cash" },
  { value: "instapay", labelAr: "إنستاباي", labelEn: "InstaPay" },
  { value: "paypal", labelAr: "باي بال", labelEn: "PayPal" },
  { value: "fawaterak", labelAr: "فاتورتك", labelEn: "Fawaterak" },
  { value: "custom", labelAr: "مخصص", labelEn: "Custom" },
] as const;

function toDraft(m?: PaymentMethod): DraftMethod {
  return {
    id: m?.id,
    type: m?.type ?? "vodafone_cash",
    name: m?.name ?? "",
    nameAr: m?.nameAr ?? "",
    accountDetails: m?.accountDetails ?? "",
    instructions: m?.instructions ?? "",
    instructionsEn: m?.instructionsEn ?? "",
    isEnabled: m?.isEnabled ?? true,
    order: m?.order ?? 0,
  };
}

export function PaymentMethodsAdmin({ initialMethods }: { initialMethods: PaymentMethod[] }) {
  const router = useRouter();
  const t = useT();
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newMethod, setNewMethod] = useState<DraftMethod>(toDraft());
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  async function refresh() {
    try {
      const res = await fetch("/api/dashboard/payment-methods");
      const data = await res.json();
      if (res.ok && Array.isArray(data.methods)) setMethods(data.methods);
    } catch {
      /* ignore */
    }
    router.refresh();
  }

  function updateMethodField(id: string, patch: Partial<PaymentMethod>) {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function saveMethod(m: PaymentMethod) {
    setError("");
    setSuccess("");
    setSavingId(m.id);
    try {
      const res = await fetch(`/api/dashboard/payment-methods/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: m.type,
          name: m.name,
          nameAr: m.nameAr,
          accountDetails: m.accountDetails,
          instructions: m.instructions,
          instructionsEn: m.instructionsEn,
          isEnabled: m.isEnabled,
          order: m.order,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.paymentMethodsAdmin.saveFailed", "Failed to save"));
      setSuccess(t("dashboard.paymentMethodsAdmin.saveSuccess", "Saved successfully"));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.paymentMethodsAdmin.saveFailed", "Failed to save"));
    } finally {
      setSavingId(null);
    }
  }

  async function deleteMethod(id: string) {
    if (!window.confirm(t("dashboard.paymentMethodsAdmin.confirmDelete", "Delete this payment method?"))) return;
    setError("");
    setSavingId(id);
    try {
      const res = await fetch(`/api/dashboard/payment-methods/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.paymentMethodsAdmin.deleteFailed", "Failed to delete"));
      setMethods((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.paymentMethodsAdmin.deleteFailed", "Failed to delete"));
    } finally {
      setSavingId(null);
    }
  }

  async function createMethod() {
    setError("");
    if (!newMethod.type.trim() || !newMethod.name.trim()) {
      setError(t("dashboard.paymentMethodsAdmin.typeNameRequired", "Type and name are required"));
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/dashboard/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMethod),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.paymentMethodsAdmin.createFailed", "Failed to create"));
      setNewMethod(toDraft());
      setShowNewForm(false);
      setSuccess(t("dashboard.paymentMethodsAdmin.createSuccess", "Payment method created"));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.paymentMethodsAdmin.createFailed", "Failed to create"));
    } finally {
      setCreating(false);
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
        {methods.map((m) => (
          <div
            key={m.id}
            className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
                <input
                  type="checkbox"
                  className="accent-[var(--color-primary)]"
                  checked={m.isEnabled}
                  onChange={(e) => updateMethodField(m.id, { isEnabled: e.target.checked })}
                />
                {t("dashboard.paymentMethodsAdmin.enabled", "Enabled")}
              </label>
              <button
                type="button"
                onClick={() => deleteMethod(m.id)}
                disabled={savingId === m.id}
                className="rounded-[var(--radius-btn)] border border-red-500/40 px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400"
              >
                {t("dashboard.paymentMethodsAdmin.delete", "Delete")}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.paymentMethodsAdmin.type", "Type")}
                </label>
                <select
                  value={KNOWN_TYPES.some((x) => x.value === m.type) ? m.type : "custom"}
                  onChange={(e) => {
                    const v = e.target.value;
                    const known = KNOWN_TYPES.find((x) => x.value === v);
                    updateMethodField(m.id, {
                      type: v === "custom" ? m.type || "custom" : v,
                      ...(known && v !== "custom"
                        ? {
                            name: known.labelEn,
                            nameAr: known.labelAr,
                          }
                        : {}),
                    });
                  }}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                >
                  {KNOWN_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.labelAr} / {opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.paymentMethodsAdmin.order", "Order")}
                </label>
                <input
                  type="number"
                  value={m.order}
                  onChange={(e) => updateMethodField(m.id, { order: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.paymentMethodsAdmin.name", "Name (English)")}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={m.name}
                  onChange={(e) => updateMethodField(m.id, { name: e.target.value })}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.paymentMethodsAdmin.nameAr", "Name (Arabic)")}
                </label>
                <input
                  type="text"
                  value={m.nameAr ?? ""}
                  onChange={(e) => updateMethodField(m.id, { nameAr: e.target.value })}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {m.type === "paypal"
                    ? t("dashboard.paymentMethodsAdmin.paypalAccount", "PayPal email / link")
                    : t("dashboard.paymentMethodsAdmin.accountDetails", "Account / wallet number")}
                </label>
                <input
                  type="text"
                  value={m.accountDetails ?? ""}
                  onChange={(e) => updateMethodField(m.id, { accountDetails: e.target.value })}
                  placeholder={
                    m.type === "paypal"
                      ? "payments@example.com"
                      : m.type === "instapay"
                        ? "InstaPay IPA / phone"
                        : "01xxxxxxxxx"
                  }
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.paymentMethodsAdmin.instructionsAr", "Instructions (Arabic)")}
                </label>
                <textarea
                  value={m.instructions ?? ""}
                  onChange={(e) => updateMethodField(m.id, { instructions: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)]">
                  {t("dashboard.paymentMethodsAdmin.instructionsEn", "Instructions (English)")}
                </label>
                <textarea
                  dir="ltr"
                  value={m.instructionsEn ?? ""}
                  onChange={(e) => updateMethodField(m.id, { instructionsEn: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => saveMethod(m)}
                disabled={savingId === m.id}
                className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {savingId === m.id
                  ? t("dashboard.paymentMethodsAdmin.saving", "Saving...")
                  : t("dashboard.paymentMethodsAdmin.save", "Save")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showNewForm ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-primary)]/50 bg-[var(--color-surface)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
            {t("dashboard.paymentMethodsAdmin.newMethodTitle", "New payment method")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={KNOWN_TYPES.some((x) => x.value === newMethod.type) ? newMethod.type : "custom"}
              onChange={(e) => {
                const v = e.target.value;
                const known = KNOWN_TYPES.find((x) => x.value === v);
                setNewMethod((f) => ({
                  ...f,
                  type: v,
                  name: known && v !== "custom" ? known.labelEn : f.name,
                  nameAr: known && v !== "custom" ? known.labelAr : f.nameAr,
                }));
              }}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            >
              {KNOWN_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.labelAr} / {opt.labelEn}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t("dashboard.paymentMethodsAdmin.namePh", "Name (English)")}
              value={newMethod.name}
              onChange={(e) => setNewMethod((f) => ({ ...f, name: e.target.value }))}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder={t("dashboard.paymentMethodsAdmin.nameArPh", "Name (Arabic)")}
              value={newMethod.nameAr}
              onChange={(e) => setNewMethod((f) => ({ ...f, nameAr: e.target.value }))}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder={t("dashboard.paymentMethodsAdmin.accountDetailsPh", "Account / wallet number")}
              value={newMethod.accountDetails}
              onChange={(e) => setNewMethod((f) => ({ ...f, accountDetails: e.target.value }))}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={createMethod}
              disabled={creating}
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {creating
                ? t("dashboard.paymentMethodsAdmin.creating", "Creating...")
                : t("dashboard.paymentMethodsAdmin.create", "Create")}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)]"
            >
              {t("dashboard.paymentMethodsAdmin.cancel", "Cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          className="rounded-[var(--radius-btn)] border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-primary)]"
        >
          {t("dashboard.paymentMethodsAdmin.addMethod", "Add payment method")}
        </button>
      )}
    </div>
  );
}
