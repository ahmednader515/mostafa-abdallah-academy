"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { fillMessage } from "@/lib/i18n/interpolate";
import type { JobCategory, JobPosting } from "@/lib/types";
import { DashboardReorderButtons } from "@/components/DashboardReorderButtons";

type FormState = {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  location: string;
  jobType: string;
  companyName: string;
  categoryId: string;
  email: string;
  phones: string[];
  whatsapp: string;
  imageUrl: string;
  salaryMin: string;
  salaryMax: string;
  salaryLabel: string;
  experienceLabel: string;
  skills: string;
  badge: string;
  showPhone: boolean;
  showEmail: boolean;
  contactOrder: "phone_first" | "email_first";
  isPublished: boolean;
};

const emptyForm = (): FormState => ({
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  location: "",
  jobType: "",
  companyName: "",
  categoryId: "",
  email: "",
  phones: [""],
  whatsapp: "",
  imageUrl: "",
  salaryMin: "",
  salaryMax: "",
  salaryLabel: "",
  experienceLabel: "",
  skills: "",
  badge: "",
  showPhone: true,
  showEmail: true,
  contactOrder: "phone_first",
  isPublished: false,
});

function jobToForm(row: JobPosting): FormState {
  const phones = row.phones?.length ? [...row.phones] : row.phone ? [row.phone] : [""];
  return {
    title: row.title,
    titleAr: row.titleAr ?? "",
    description: row.description,
    descriptionAr: row.descriptionAr ?? "",
    location: row.location ?? "",
    jobType: row.jobType ?? "",
    companyName: row.companyName ?? "",
    categoryId: row.categoryId ?? "",
    email: row.email ?? "",
    phones: phones.length ? phones : [""],
    whatsapp: row.whatsapp ?? "",
    imageUrl: row.imageUrl ?? "",
    salaryMin: row.salaryMin != null ? String(row.salaryMin) : "",
    salaryMax: row.salaryMax != null ? String(row.salaryMax) : "",
    salaryLabel: row.salaryLabel ?? "",
    experienceLabel: row.experienceLabel ?? "",
    skills: (row.skills ?? []).join(", "),
    badge: row.badge ?? "",
    showPhone: row.showPhone !== false,
    showEmail: row.showEmail !== false,
    contactOrder: row.contactOrder === "email_first" ? "email_first" : "phone_first",
    isPublished: row.isPublished,
  };
}

function formPayload(form: FormState) {
  return {
    title: form.title.trim(),
    titleAr: form.titleAr.trim() || null,
    description: form.description.trim(),
    descriptionAr: form.descriptionAr.trim() || null,
    location: form.location.trim() || null,
    jobType: form.jobType.trim() || null,
    companyName: form.companyName.trim() || null,
    categoryId: form.categoryId.trim() || null,
    email: form.email.trim() || null,
    phones: form.phones.map((p) => p.trim()).filter(Boolean),
    whatsapp: form.whatsapp.trim() || null,
    imageUrl: form.imageUrl.trim() || null,
    salaryMin: form.salaryMin.trim() === "" ? null : Number(form.salaryMin),
    salaryMax: form.salaryMax.trim() === "" ? null : Number(form.salaryMax),
    salaryLabel: form.salaryLabel.trim() || null,
    experienceLabel: form.experienceLabel.trim() || null,
    skills: form.skills,
    badge: form.badge.trim() || null,
    showPhone: form.showPhone,
    showEmail: form.showEmail,
    contactOrder: form.contactOrder,
    isPublished: form.isPublished,
  };
}

export function JobsAdminClient({
  initialJobs,
  initialCategories,
  initialHeroImageUrl,
}: {
  initialJobs: JobPosting[];
  initialCategories: JobCategory[];
  initialHeroImageUrl: string;
}) {
  const router = useRouter();
  const t = useT();
  const J = "dashboard.jobsAdmin";
  const [jobs, setJobs] = useState(initialJobs);
  const [categories, setCategories] = useState(initialCategories);
  const [heroImageUrl, setHeroImageUrl] = useState(initialHeroImageUrl);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroSaving, setHeroSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatNameAr, setNewCatNameAr] = useState("");

  const reload = useCallback(async () => {
    const res = await fetch("/api/dashboard/jobs", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { jobs?: JobPosting[]; categories?: JobCategory[] };
    if (data.jobs) setJobs(data.jobs);
    if (data.categories) setCategories(data.categories);
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
      const res = await fetch("/api/upload/image", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? t(`${J}.uploadFailed`, "Image upload failed"));
        return;
      }
      patchForm("imageUrl", String(data.url));
    } catch {
      setError(t(`${J}.uploadFailed`, "Image upload failed"));
    } finally {
      setUploading(false);
    }
  }

  async function uploadHeroImage(file: File | undefined) {
    if (!file) return;
    setHeroUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? t(`${J}.uploadFailed`, "Image upload failed"));
        return;
      }
      const url = String(data.url);
      setHeroImageUrl(url);
      setHeroSaving(true);
      const saveRes = await fetch("/api/dashboard/settings/jobs-hero", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const saveData = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) {
        setError(saveData.error ?? t(`${J}.heroSaveFailed`, "Failed to save section image"));
        return;
      }
      setSuccess(t(`${J}.heroSaved`, "Section top image saved"));
      router.refresh();
    } catch {
      setError(t(`${J}.uploadFailed`, "Image upload failed"));
    } finally {
      setHeroUploading(false);
      setHeroSaving(false);
    }
  }

  async function saveHeroImageUrl() {
    setError("");
    setHeroSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings/jobs-hero", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: heroImageUrl.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t(`${J}.heroSaveFailed`, "Failed to save section image"));
        return;
      }
      if (typeof data.url === "string") setHeroImageUrl(data.url);
      setSuccess(t(`${J}.heroSaved`, "Section top image saved"));
      router.refresh();
    } finally {
      setHeroSaving(false);
    }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim() && !newCatNameAr.trim()) return;
    setError("");
    const res = await fetch("/api/dashboard/job-categories", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCatName.trim() || newCatNameAr.trim(),
        nameAr: newCatNameAr.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? t(`${J}.categoryFailed`, "Failed to create category"));
      return;
    }
    setNewCatName("");
    setNewCatNameAr("");
    setSuccess(t(`${J}.categoryCreated`, "Category created"));
    await reload();
    router.refresh();
  }

  async function saveJob(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.title.trim()) {
      setError(t(`${J}.titleRequired`, "Job title is required"));
      return;
    }
    setLoading(true);
    const payload = formPayload(form);
    const res = await fetch(
      editingId ? `/api/dashboard/jobs/${encodeURIComponent(editingId)}` : "/api/dashboard/jobs",
      {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t(`${J}.saveFailed`, "Failed to save job"));
      return;
    }
    setSuccess(editingId ? t(`${J}.updateSuccess`, "Job updated") : t(`${J}.createSuccess`, "Job created"));
    setForm(emptyForm());
    setEditingId(null);
    await reload();
    router.refresh();
  }

  function startEdit(row: JobPosting) {
    setEditingId(row.id);
    setForm(jobToForm(row));
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function removeRow(row: JobPosting) {
    if (!window.confirm(fillMessage(t(`${J}.confirmDelete`, "Delete job «{title}»?"), { title: row.title }))) return;
    const res = await fetch(`/api/dashboard/jobs/${encodeURIComponent(row.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) return;
    if (editingId === row.id) cancelEdit();
    await reload();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">{t(`${J}.pageTitle`, "Jobs board")}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t(`${J}.pageIntro`, "Manage job categories, images, contacts, and publish listings.")}
        </p>
      </div>

      {error ? <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="rounded-[var(--radius-btn)] bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">{success}</div> : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
        <h3 className="text-lg font-semibold">
          {t(`${J}.heroImageTitle`, "Section top image")}
        </h3>
        <p className="text-sm text-[var(--color-muted)]">
          {t(
            `${J}.heroImageIntro`,
            "This image appears at the top of the public jobs page (hero banner).",
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium">
            {heroUploading || heroSaving ? "…" : t(`${J}.uploadHeroImage`, "Upload top image")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void uploadHeroImage(e.target.files?.[0])}
            />
          </label>
          <input
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            placeholder={t(`${J}.heroImageUrlPlaceholder`, "Or paste image URL")}
            className="min-w-[14rem] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
          <button
            type="button"
            disabled={heroSaving}
            onClick={() => void saveHeroImageUrl()}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {heroSaving ? "…" : t(`${J}.saveHeroImage`, "Save image")}
          </button>
        </div>
        {heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageUrl}
            alt=""
            className="mt-2 h-40 w-full max-w-xl rounded-xl object-cover ring-1 ring-[var(--color-border)]"
          />
        ) : null}
      </div>

      <form onSubmit={(e) => void createCategory(e)} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
        <h3 className="text-lg font-semibold">{t(`${J}.categoriesTitle`, "Job categories")}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <input value={newCatNameAr} onChange={(e) => setNewCatNameAr(e.target.value)} placeholder={t(`${J}.categoryNameAr`, "Category name (AR)")} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder={t(`${J}.categoryNameEn`, "Category name (EN)")} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <button type="submit" className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white">
            {t(`${J}.addCategory`, "Add category")}
          </button>
        </div>
        {categories.length > 0 ? (
          <p className="text-xs text-[var(--color-muted)]">
            {categories.map((c) => c.nameAr || c.name).join(" · ")}
          </p>
        ) : null}
      </form>

      <form onSubmit={(e) => void saveJob(e)} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
        <h3 className="text-lg font-semibold">
          {editingId ? t(`${J}.editJob`, "Edit job") : t(`${J}.addJob`, "Add job")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.title} onChange={(e) => patchForm("title", e.target.value)} placeholder={t(`${J}.titlePlaceholder`, "Title (EN)")} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <input value={form.titleAr} onChange={(e) => patchForm("titleAr", e.target.value)} placeholder={t(`${J}.titleArPlaceholder`, "Title (AR)")} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
        </div>
        <textarea value={form.description} onChange={(e) => patchForm("description", e.target.value)} placeholder={t(`${J}.descriptionPlaceholder`, "Description (EN)")} rows={3} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
        <textarea value={form.descriptionAr} onChange={(e) => patchForm("descriptionAr", e.target.value)} placeholder={t(`${J}.descriptionArPlaceholder`, "Description (AR)")} rows={3} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />

        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.companyName} onChange={(e) => patchForm("companyName", e.target.value)} placeholder={t(`${J}.companyPlaceholder`, "Company name")} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <select value={form.categoryId} onChange={(e) => patchForm("categoryId", e.target.value)} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
            <option value="">{t(`${J}.noCategory`, "No category")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>
            ))}
          </select>
          <input value={form.location} onChange={(e) => patchForm("location", e.target.value)} placeholder={t(`${J}.locationPlaceholder`, "Location")} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <input value={form.jobType} onChange={(e) => patchForm("jobType", e.target.value)} placeholder={t(`${J}.jobTypePlaceholder`, "Job type")} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <input value={form.experienceLabel} onChange={(e) => patchForm("experienceLabel", e.target.value)} placeholder={t(`${J}.experiencePlaceholder`, "Experience (e.g. 2-4 years)")} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <select value={form.badge} onChange={(e) => patchForm("badge", e.target.value)} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
            <option value="">{t(`${J}.noBadge`, "No badge")}</option>
            <option value="featured">{t(`${J}.badgeFeatured`, "Featured")}</option>
            <option value="new">{t(`${J}.badgeNew`, "New")}</option>
            <option value="remote">{t(`${J}.badgeRemote`, "Remote")}</option>
            <option value="urgent">{t(`${J}.badgeUrgent`, "Urgent")}</option>
          </select>
          <input value={form.salaryMin} onChange={(e) => patchForm("salaryMin", e.target.value)} placeholder={t(`${J}.salaryMin`, "Salary min")} type="number" className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <input value={form.salaryMax} onChange={(e) => patchForm("salaryMax", e.target.value)} placeholder={t(`${J}.salaryMax`, "Salary max")} type="number" className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <input value={form.salaryLabel} onChange={(e) => patchForm("salaryLabel", e.target.value)} placeholder={t(`${J}.salaryLabel`, "Salary label (optional override)")} className="sm:col-span-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <input value={form.skills} onChange={(e) => patchForm("skills", e.target.value)} placeholder={t(`${J}.skillsPlaceholder`, "Skills (comma separated)")} className="sm:col-span-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
        </div>

        <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] p-4 space-y-3">
          <h4 className="font-semibold text-sm">{t(`${J}.imageSection`, "Job image")}</h4>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-2 text-sm">
              {uploading ? "…" : t(`${J}.uploadImage`, "Upload image")}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => void uploadImage(e.target.files?.[0])} />
            </label>
            <input value={form.imageUrl} onChange={(e) => patchForm("imageUrl", e.target.value)} placeholder={t(`${J}.imagePlaceholder`, "Or paste image URL")} className="min-w-[14rem] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          </div>
          {form.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imageUrl} alt="" className="h-28 w-40 rounded-lg object-cover" />
          ) : null}
        </div>

        <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] p-4 space-y-3">
          <h4 className="font-semibold text-sm">{t(`${J}.contactSection`, "Contact details")}</h4>
          <input value={form.email} onChange={(e) => patchForm("email", e.target.value)} placeholder={t(`${J}.emailPlaceholder`, "Contact email")} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <div className="space-y-2">
            {form.phones.map((phone, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={phone}
                  onChange={(e) => {
                    const next = [...form.phones];
                    next[idx] = e.target.value;
                    patchForm("phones", next);
                  }}
                  placeholder={t(`${J}.phonePlaceholder`, "Phone")}
                  className="flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                />
                {form.phones.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => patchForm("phones", form.phones.filter((_, i) => i !== idx))}
                    className="rounded-[var(--radius-btn)] border border-red-500/40 px-3 text-sm text-red-600"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={() => patchForm("phones", [...form.phones, ""])}
              className="text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              {t(`${J}.addPhone`, "+ Add another phone")}
            </button>
          </div>
          <input value={form.whatsapp} onChange={(e) => patchForm("whatsapp", e.target.value)} placeholder={t(`${J}.whatsappPlaceholder`, "WhatsApp")} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.showPhone} onChange={(e) => patchForm("showPhone", e.target.checked)} />
              {t(`${J}.showPhone`, "Show phone")}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.showEmail} onChange={(e) => patchForm("showEmail", e.target.checked)} />
              {t(`${J}.showEmail`, "Show email")}
            </label>
            <label className="flex items-center gap-2">
              {t(`${J}.contactOrder`, "Contact order")}
              <select
                value={form.contactOrder}
                onChange={(e) => patchForm("contactOrder", e.target.value as "phone_first" | "email_first")}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1"
              >
                <option value="phone_first">{t(`${J}.phoneFirst`, "Phone first")}</option>
                <option value="email_first">{t(`${J}.emailFirst`, "Email first")}</option>
              </select>
            </label>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => patchForm("isPublished", e.target.checked)} />
          {t(`${J}.published`, "Published")}
        </label>

        <div className="flex flex-wrap gap-3">
          <button disabled={loading} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white disabled:opacity-50">
            {loading ? "…" : editingId ? t(`${J}.saveChanges`, "Save changes") : t(`${J}.save`, "Save")}
          </button>
          {editingId ? (
            <button type="button" onClick={cancelEdit} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm">
              {t(`${J}.cancel`, "Cancel")}
            </button>
          ) : null}
        </div>
      </form>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="text-lg font-semibold">{t(`${J}.jobsList`, "All jobs")}</h3>
        <div className="mt-4 space-y-3">
          {jobs.map((job, idx) => (
            <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] p-4">
              <div className="flex items-center gap-3">
                {job.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-border)]/40 text-xs">—</span>
                )}
                <div>
                  <p className="font-semibold">{job.titleAr || job.title}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {job.isPublished ? t(`${J}.statusPublished`, "Published") : t(`${J}.statusDraft`, "Draft")}
                    {job.companyName ? ` · ${job.companyName}` : ""}
                    {job.location ? ` · ${job.location}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <DashboardReorderButtons
                  entity="job"
                  orderedIds={jobs.map((j) => j.id)}
                  index={idx}
                  onReordered={() => void reload().then(() => router.refresh())}
                />
                <button type="button" onClick={() => startEdit(job)} className="text-amber-500 underline">{t(`${J}.edit`, "Edit")}</button>
                <button type="button" onClick={() => void removeRow(job)} className="text-red-500 underline">{t(`${J}.delete`, "Delete")}</button>
              </div>
            </div>
          ))}
          {jobs.length === 0 ? <p className="text-sm text-[var(--color-muted)]">{t(`${J}.empty`, "No jobs yet.")}</p> : null}
        </div>
      </div>
    </div>
  );
}
