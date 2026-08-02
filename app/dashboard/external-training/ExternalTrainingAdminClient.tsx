"use client";

import { useCallback, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import type { ExternalTrainingPage } from "@/lib/lms-features-db";
import {
  DEFAULT_CREDENTIAL_FIELD_NAMES,
  parseCredentialsForAdmin,
} from "@/lib/external-training-credentials";

type FormState = {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  imageUrl: string;
  launchUrl: string;
  launchMethod: "POST" | "GET";
  username: string;
  password: string;
  officeId: string;
  usernameField: string;
  passwordField: string;
  officeIdField: string;
  isPublished: boolean;
  showAdvancedFields: boolean;
};

const emptyForm = (): FormState => ({
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  imageUrl: "",
  launchUrl: "",
  launchMethod: "POST",
  username: "",
  password: "",
  officeId: "",
  usernameField: DEFAULT_CREDENTIAL_FIELD_NAMES.username,
  passwordField: DEFAULT_CREDENTIAL_FIELD_NAMES.password,
  officeIdField: DEFAULT_CREDENTIAL_FIELD_NAMES.officeId,
  isPublished: true,
  showAdvancedFields: false,
});

function pageToForm(page: ExternalTrainingPage): FormState {
  const creds = parseCredentialsForAdmin(page.credentialsJson);
  return {
    title: page.title,
    titleAr: page.titleAr ?? "",
    description: page.description ?? "",
    descriptionAr: page.descriptionAr ?? "",
    imageUrl: page.imageUrl ?? "",
    launchUrl: page.launchUrl,
    launchMethod: page.launchMethod?.toUpperCase() === "GET" ? "GET" : "POST",
    username: creds.username,
    password: creds.password,
    officeId: creds.officeId,
    usernameField: creds.fieldNames.username,
    passwordField: creds.fieldNames.password,
    officeIdField: creds.fieldNames.officeId,
    isPublished: page.isPublished,
    showAdvancedFields:
      creds.fieldNames.username !== DEFAULT_CREDENTIAL_FIELD_NAMES.username ||
      creds.fieldNames.password !== DEFAULT_CREDENTIAL_FIELD_NAMES.password ||
      creds.fieldNames.officeId !== DEFAULT_CREDENTIAL_FIELD_NAMES.officeId,
  };
}

function formPayload(form: FormState) {
  return {
    title: form.title.trim(),
    titleAr: form.titleAr.trim() || null,
    description: form.description.trim(),
    descriptionAr: form.descriptionAr.trim() || null,
    imageUrl: form.imageUrl.trim() || null,
    launchUrl: form.launchUrl.trim(),
    launchMethod: form.launchMethod,
    username: form.username,
    password: form.password,
    officeId: form.officeId.trim(),
    usernameField: form.usernameField.trim() || DEFAULT_CREDENTIAL_FIELD_NAMES.username,
    passwordField: form.passwordField.trim() || DEFAULT_CREDENTIAL_FIELD_NAMES.password,
    officeIdField: form.officeIdField.trim() || DEFAULT_CREDENTIAL_FIELD_NAMES.officeId,
    isPublished: form.isPublished,
  };
}

export function ExternalTrainingAdminClient({
  initialPages,
}: {
  initialPages: ExternalTrainingPage[];
}) {
  const t = useT();
  const E = "dashboard.externalTrainingAdmin";
  const [pages, setPages] = useState(initialPages);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/dashboard/external-training", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { pages?: ExternalTrainingPage[] };
    if (data.pages) setPages(data.pages);
  }, []);

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? t(`${E}.uploadFailed`, "Image upload failed"));
        return;
      }
      patchForm("imageUrl", String(data.url));
    } catch {
      setError(t(`${E}.uploadFailed`, "Image upload failed"));
    } finally {
      setUploading(false);
    }
  }

  function startEdit(page: ExternalTrainingPage) {
    setEditingId(page.id);
    setForm(pageToForm(page));
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  }

  async function save() {
    setError("");
    setSuccess("");
    if (!form.title.trim()) {
      setError(t(`${E}.titleRequired`, "Title is required"));
      return;
    }
    if (!form.launchUrl.trim()) {
      setError(t(`${E}.launchUrlRequired`, "Launch URL is required"));
      return;
    }
    setLoading(true);
    try {
      const payload = formPayload(form);
      const url = editingId
        ? `/api/dashboard/external-training/${editingId}`
        : "/api/dashboard/external-training";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error ??
            (editingId
              ? t(`${E}.updateFailed`, "Failed to update")
              : t(`${E}.createFailed`, "Failed to create")),
        );
        return;
      }
      setSuccess(
        editingId
          ? t(`${E}.updateSuccess`, "Site updated")
          : t(`${E}.createSuccess`, "Site created"),
      );
      setEditingId(null);
      setForm(emptyForm());
      await reload();
    } catch {
      setError(t(`${E}.saveFailed`, "Save failed"));
    } finally {
      setLoading(false);
    }
  }

  async function togglePublished(page: ExternalTrainingPage) {
    await fetch(`/api/dashboard/external-training/${page.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !page.isPublished }),
    });
    await reload();
  }

  async function remove(page: ExternalTrainingPage) {
    const label = page.titleAr || page.title;
    if (
      !window.confirm(
        t(`${E}.confirmDelete`, "Delete this training site?") + ` «${label}»`,
      )
    ) {
      return;
    }
    await fetch(`/api/dashboard/external-training/${page.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (editingId === page.id) cancelEdit();
    await reload();
  }

  const inputClass =
    "w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm";

  return (
    <div className="mt-6 space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      <div className="space-y-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="font-semibold text-[var(--color-foreground)]">
          {editingId
            ? t(`${E}.editSite`, "Edit training site")
            : t(`${E}.addSite`, "Add training site")}
        </h3>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">
              {t(`${E}.titleEn`, "Title (EN)")}
            </span>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => patchForm("title", e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">
              {t(`${E}.titleAr`, "Title (AR)")}
            </span>
            <input
              className={inputClass}
              value={form.titleAr}
              onChange={(e) => patchForm("titleAr", e.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--color-muted)]">
            {t(`${E}.launchUrl`, "Launch URL")}
          </span>
          <input
            dir="ltr"
            className={inputClass}
            value={form.launchUrl}
            onChange={(e) => patchForm("launchUrl", e.target.value)}
            placeholder="https://..."
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">
              {t(`${E}.username`, "Username")}
            </span>
            <input
              dir="ltr"
              className={inputClass}
              value={form.username}
              onChange={(e) => patchForm("username", e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">
              {t(`${E}.password`, "Password")}
            </span>
            <input
              dir="ltr"
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => patchForm("password", e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">
              {t(`${E}.officeId`, "Office ID (optional)")}
            </span>
            <input
              dir="ltr"
              className={inputClass}
              value={form.officeId}
              onChange={(e) => patchForm("officeId", e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">
              {t(`${E}.descriptionEn`, "Description (EN, optional)")}
            </span>
            <textarea
              className={`${inputClass} min-h-[88px]`}
              value={form.description}
              onChange={(e) => patchForm("description", e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">
              {t(`${E}.descriptionAr`, "Description (AR, optional)")}
            </span>
            <textarea
              className={`${inputClass} min-h-[88px]`}
              value={form.descriptionAr}
              onChange={(e) => patchForm("descriptionAr", e.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <span className="block text-[var(--color-muted)]">
              {t(`${E}.logo`, "Logo / image (optional)")}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2">
                {uploading ? "…" : t(`${E}.uploadImage`, "Upload image")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void uploadImage(e.target.files?.[0])}
                />
              </label>
              <input
                dir="ltr"
                className={`min-w-[12rem] flex-1 ${inputClass}`}
                value={form.imageUrl}
                onChange={(e) => patchForm("imageUrl", e.target.value)}
                placeholder={t(`${E}.imagePlaceholder`, "Or paste image URL")}
              />
            </div>
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.imageUrl}
                alt=""
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--color-muted)]">
                {t(`${E}.launchMethod`, "Launch method")}
              </span>
              <select
                className={inputClass}
                value={form.launchMethod}
                onChange={(e) =>
                  patchForm("launchMethod", e.target.value === "GET" ? "GET" : "POST")
                }
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => patchForm("isPublished", e.target.checked)}
              />
              <span>{t(`${E}.enabled`, "Enabled (published)")}</span>
            </label>
          </div>
        </div>

        <button
          type="button"
          className="text-sm font-medium text-[var(--color-primary)] underline"
          onClick={() => patchForm("showAdvancedFields", !form.showAdvancedFields)}
        >
          {form.showAdvancedFields
            ? t(`${E}.hideFieldNames`, "Hide form field names")
            : t(`${E}.showFieldNames`, "Customize form field names")}
        </button>

        {form.showAdvancedFields ? (
          <div className="grid gap-3 rounded border border-dashed border-[var(--color-border)] p-3 md:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--color-muted)]">
                {t(`${E}.usernameField`, "Username field name")}
              </span>
              <input
                dir="ltr"
                className={inputClass}
                value={form.usernameField}
                onChange={(e) => patchForm("usernameField", e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--color-muted)]">
                {t(`${E}.passwordField`, "Password field name")}
              </span>
              <input
                dir="ltr"
                className={inputClass}
                value={form.passwordField}
                onChange={(e) => patchForm("passwordField", e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--color-muted)]">
                {t(`${E}.officeIdField`, "Office ID field name")}
              </span>
              <input
                dir="ltr"
                className={inputClass}
                value={form.officeIdField}
                onChange={(e) => patchForm("officeIdField", e.target.value)}
              />
            </label>
            <p className="md:col-span-3 text-xs text-[var(--color-muted)]">
              {t(
                `${E}.fieldNamesHint`,
                "These names must match the login form fields on the external portal.",
              )}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void save()}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading
              ? "…"
              : editingId
                ? t(`${E}.saveChanges`, "Save changes")
                : t(`${E}.create`, "Create site")}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm"
            >
              {t(`${E}.cancel`, "Cancel")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">{t(`${E}.listTitle`, "Training sites")}</h3>
        {pages.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {t(`${E}.empty`, "No training sites yet.")}
          </p>
        ) : (
          pages.map((page) => (
            <div
              key={page.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                {page.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={page.imageUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--color-background)] text-xs text-[var(--color-muted)]">
                    —
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {page.titleAr || page.title}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]" dir="ltr">
                    {page.launchUrl}
                  </p>
                  <p className="mt-0.5 text-xs">
                    {page.isPublished
                      ? t(`${E}.statusEnabled`, "Enabled")
                      : t(`${E}.statusDisabled`, "Disabled")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => startEdit(page)}
                  className="underline"
                >
                  {t(`${E}.edit`, "Edit")}
                </button>
                <button
                  type="button"
                  onClick={() => void togglePublished(page)}
                  className="underline"
                >
                  {page.isPublished
                    ? t(`${E}.disable`, "Disable")
                    : t(`${E}.enable`, "Enable")}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(page)}
                  className="text-red-600 underline"
                >
                  {t(`${E}.delete`, "Delete")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
