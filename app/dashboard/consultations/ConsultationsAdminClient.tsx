"use client";

import { useState } from "react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useT } from "@/components/LocaleProvider";

type Offer = {
  id: string;
  title: string;
  titleAr: string | null;
  description: string;
  descriptionAr: string | null;
  imageUrl: string | null;
  scheduleText: string | null;
  scheduleTextAr: string | null;
  price: number;
  isPublished: boolean;
};

type FormState = {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  imageUrl: string;
  scheduleText: string;
  scheduleTextAr: string;
  price: number;
};

const emptyForm = (): FormState => ({
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  imageUrl: "",
  scheduleText: "",
  scheduleTextAr: "",
  price: 0,
});

export function ConsultationsAdminClient({ initialOffers }: { initialOffers: Offer[] }) {
  const t = useT();
  const [offers, setOffers] = useState(initialOffers);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function reload() {
    const r = await fetch("/api/dashboard/consultations");
    const d = await r.json();
    if (r.ok) setOffers(d.offers ?? d.items ?? []);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
      patchForm("imageUrl", String(data.url));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function startEdit(offer: Offer) {
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      titleAr: offer.titleAr ?? "",
      description: offer.description ?? "",
      descriptionAr: offer.descriptionAr ?? "",
      imageUrl: offer.imageUrl ?? "",
      scheduleText: offer.scheduleText ?? "",
      scheduleTextAr: offer.scheduleTextAr ?? "",
      price: offer.price,
    });
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  }

  async function save() {
    if (!form.title.trim() && !form.titleAr.trim()) {
      setError(t("consultations.adminTitleRequired", "العنوان مطلوب"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim() || form.titleAr.trim(),
        titleAr: form.titleAr.trim() || null,
        description: form.description,
        descriptionAr: form.descriptionAr.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        scheduleText: form.scheduleText.trim() || null,
        scheduleTextAr: form.scheduleTextAr.trim() || null,
        price: Number(form.price) || 0,
      };
      const url = editingId
        ? `/api/dashboard/consultations/${encodeURIComponent(editingId)}`
        : "/api/dashboard/consultations";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || t("consultations.adminSaveFailed", "فشل الحفظ"));
      }
      resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("consultations.adminSaveFailed", "فشل الحفظ"));
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, data: object) {
    await fetch(`/api/dashboard/consultations/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await reload();
  }

  async function remove(id: string) {
    if (!window.confirm(t("common.confirmDelete", "Delete this item?"))) return;
    await fetch(`/api/dashboard/consultations/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    await reload();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t("consultations.adminTitle", "إدارة الاستشارات")}</h2>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3 rounded-xl border border-[var(--color-border)] p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.title}
            onChange={(e) => patchForm("title", e.target.value)}
            placeholder={t("consultations.adminTitleEn", "Title (EN)")}
            className="rounded border px-3 py-2"
          />
          <input
            value={form.titleAr}
            onChange={(e) => patchForm("titleAr", e.target.value)}
            placeholder={t("consultations.adminTitleAr", "العنوان (AR)")}
            className="rounded border px-3 py-2"
          />
          <textarea
            value={form.description}
            onChange={(e) => patchForm("description", e.target.value)}
            placeholder={t("consultations.adminDescEn", "Description (EN)")}
            rows={3}
            className="rounded border px-3 py-2 md:col-span-1"
          />
          <textarea
            value={form.descriptionAr}
            onChange={(e) => patchForm("descriptionAr", e.target.value)}
            placeholder={t("consultations.adminDescAr", "الوصف (AR)")}
            rows={3}
            className="rounded border px-3 py-2"
          />
          <input
            value={form.scheduleText}
            onChange={(e) => patchForm("scheduleText", e.target.value)}
            placeholder={t("consultations.adminScheduleEn", "Schedule (EN)")}
            className="rounded border px-3 py-2"
          />
          <input
            value={form.scheduleTextAr}
            onChange={(e) => patchForm("scheduleTextAr", e.target.value)}
            placeholder={t("consultations.adminScheduleAr", "المواعيد (AR)")}
            className="rounded border px-3 py-2"
          />
          <input
            type="number"
            value={form.price}
            onChange={(e) => patchForm("price", Number(e.target.value))}
            placeholder={t("consultations.adminPrice", "Price")}
            className="rounded border px-3 py-2"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file);
                  e.target.value = "";
                }}
              />
              {uploading
                ? t("consultations.adminUploading", "جاري الرفع…")
                : t("consultations.adminUploadImage", "رفع صورة")}
            </label>
            {form.imageUrl ? (
              <div className="relative h-14 w-20 overflow-hidden rounded border">
                <OptimizedImage src={form.imageUrl} alt="" fill className="object-cover" sizes="80px" />
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving
              ? t("consultations.adminSaving", "جاري الحفظ…")
              : editingId
                ? t("consultations.adminUpdate", "تحديث")
                : t("consultations.adminCreate", "إنشاء")}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded border px-4 py-2 text-sm"
            >
              {t("common.cancel", "Cancel")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded border p-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              {offer.imageUrl ? (
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded">
                  <OptimizedImage
                    src={offer.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : null}
              <div className="min-w-0">
                <p className="font-semibold">{offer.titleAr || offer.title}</p>
                <p className="truncate text-xs text-[var(--color-muted)]">
                  {offer.price} · {offer.isPublished ? t("consultations.published", "منشور") : t("consultations.draft", "مسودة")}
                </p>
              </div>
            </div>
            <span className="flex flex-wrap gap-3 text-sm">
              <button type="button" onClick={() => startEdit(offer)} className="underline">
                {t("common.edit", "Edit")}
              </button>
              <button
                type="button"
                onClick={() => void patch(offer.id, { isPublished: !offer.isPublished })}
                className="underline"
              >
                {offer.isPublished
                  ? t("consultations.unpublish", "إخفاء")
                  : t("consultations.publish", "نشر")}
              </button>
              <button
                type="button"
                onClick={() => void remove(offer.id)}
                className="text-red-600 underline"
              >
                {t("common.delete", "Delete")}
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
