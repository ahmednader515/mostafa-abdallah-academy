"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { fillMessage } from "@/lib/i18n/interpolate";
import type { JobPosting } from "@/lib/types";
import { DashboardReorderButtons } from "@/components/DashboardReorderButtons";

export function JobsAdminClient({ initialJobs }: { initialJobs: JobPosting[] }) {
  const router = useRouter();
  const t = useT();
  const J = "dashboard.jobsAdmin";
  const [jobs, setJobs] = useState(initialJobs);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTitleAr, setEditTitleAr] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDescriptionAr, setEditDescriptionAr] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editJobType, setEditJobType] = useState("");
  const [editPublished, setEditPublished] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/dashboard/jobs", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { jobs?: JobPosting[] };
    if (data.jobs) setJobs(data.jobs);
  }, []);

  async function createJob(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!title.trim()) {
      setError(t(`${J}.titleRequired`, "Job title is required"));
      return;
    }
    setLoading(true);
    const res = await fetch("/api/dashboard/jobs", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        titleAr: titleAr.trim() || null,
        description: description.trim(),
        descriptionAr: descriptionAr.trim() || null,
        location: location.trim() || null,
        jobType: jobType.trim() || null,
        isPublished: false,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? t(`${J}.createFailed`, "Failed to create job"));
    setSuccess(t(`${J}.createSuccess`, "Job created"));
    setTitle("");
    setTitleAr("");
    setDescription("");
    setDescriptionAr("");
    setLocation("");
    setJobType("");
    await reload();
    router.refresh();
  }

  function startEdit(row: JobPosting) {
    setEditingId(row.id);
    setEditTitle(row.title);
    setEditTitleAr(row.titleAr ?? "");
    setEditDescription(row.description);
    setEditDescriptionAr(row.descriptionAr ?? "");
    setEditLocation(row.location ?? "");
    setEditJobType(row.jobType ?? "");
    setEditPublished(row.isPublished);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError("");
    setSuccess("");
    if (!editTitle.trim()) {
      setError(t(`${J}.titleRequired`, "Job title is required"));
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/dashboard/jobs/${encodeURIComponent(editingId)}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim(),
        titleAr: editTitleAr.trim() || null,
        description: editDescription.trim(),
        descriptionAr: editDescriptionAr.trim() || null,
        location: editLocation.trim() || null,
        jobType: editJobType.trim() || null,
        isPublished: editPublished,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? t(`${J}.updateFailed`, "Failed to update job"));
    setSuccess(t(`${J}.updateSuccess`, "Job updated"));
    cancelEdit();
    await reload();
    router.refresh();
  }

  async function handleJobsReordered() {
    await reload();
    router.refresh();
  }

  async function removeRow(row: JobPosting) {
    if (!window.confirm(fillMessage(t(`${J}.confirmDelete`, "Delete job «{title}»?"), { title: row.title }))) return;
    const res = await fetch(`/api/dashboard/jobs/${encodeURIComponent(row.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) return;
    await reload();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">{t(`${J}.pageTitle`, "Jobs board")}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t(`${J}.pageIntro`, "Create and manage job postings shown on the public jobs page.")}</p>
      </div>

      {error ? <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="rounded-[var(--radius-btn)] bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">{success}</div> : null}

      <form onSubmit={(e) => void createJob(e)} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
        <h3 className="text-lg font-semibold">{t(`${J}.addJob`, "Add job")}</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t(`${J}.titlePlaceholder`, "Title (EN)")} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
        <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder={t(`${J}.titleArPlaceholder`, "Title (AR)")} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t(`${J}.descriptionPlaceholder`, "Description (EN)")} rows={4} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
        <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} placeholder={t(`${J}.descriptionArPlaceholder`, "Description (AR)")} rows={4} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t(`${J}.locationPlaceholder`, "Location")} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <input value={jobType} onChange={(e) => setJobType(e.target.value)} placeholder={t(`${J}.jobTypePlaceholder`, "Job type (full-time, part-time…)")} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
        </div>
        <button disabled={loading} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white disabled:opacity-50">{t(`${J}.save`, "Save")}</button>
      </form>

      {editingId ? (
        <form onSubmit={(e) => void saveEdit(e)} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
          <h3 className="text-lg font-semibold">{t(`${J}.editJob`, "Edit job")}</h3>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <input value={editTitleAr} onChange={(e) => setEditTitleAr(e.target.value)} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <textarea value={editDescriptionAr} onChange={(e) => setEditDescriptionAr(e.target.value)} rows={4} className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
            <input value={editJobType} onChange={(e) => setEditJobType(e.target.value)} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editPublished} onChange={(e) => setEditPublished(e.target.checked)} />
            {t(`${J}.published`, "Published")}
          </label>
          <div className="flex gap-3">
            <button disabled={loading} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white">{t(`${J}.saveChanges`, "Save changes")}</button>
            <button type="button" onClick={cancelEdit} className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm">{t(`${J}.cancel`, "Cancel")}</button>
          </div>
        </form>
      ) : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="text-lg font-semibold">{t(`${J}.jobsList`, "All jobs")}</h3>
        <div className="mt-4 space-y-3">
          {jobs.map((job, idx) => (
            <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] p-4">
              <div>
                <p className="font-semibold">{job.titleAr || job.title}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {job.isPublished ? t(`${J}.statusPublished`, "Published") : t(`${J}.statusDraft`, "Draft")}
                  {job.location ? ` · ${job.location}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <DashboardReorderButtons
                  entity="job"
                  orderedIds={jobs.map((j) => j.id)}
                  index={idx}
                  onReordered={() => void handleJobsReordered()}
                />
                <button onClick={() => startEdit(job)} className="text-amber-500 underline">{t(`${J}.edit`, "Edit")}</button>
                <button onClick={() => void removeRow(job)} className="text-red-500 underline">{t(`${J}.delete`, "Delete")}</button>
              </div>
            </div>
          ))}
          {jobs.length === 0 ? <p className="text-sm text-[var(--color-muted)]">{t(`${J}.empty`, "No jobs yet.")}</p> : null}
        </div>
      </div>
    </div>
  );
}
