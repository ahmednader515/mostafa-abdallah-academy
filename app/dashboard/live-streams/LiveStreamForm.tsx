"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

type CourseOption = { id: string; title: string };
type CategoryOption = { id: string; title: string };
type LiveStreamProvider = "zoom" | "google_meet" | "youtube_live" | "external";
type LiveStreamAccessMode = "public" | "members" | "paid" | "subscribers" | "course_enrolled";

type Props = {
  courseOptions: CourseOption[];
  categoryOptions?: CategoryOption[];
  initialData?: {
    id: string;
    courseId: string;
    title: string;
    titleAr: string;
    provider: LiveStreamProvider;
    meetingUrl: string;
    meetingId: string;
    meetingPassword: string;
    scheduledAt: string;
    description: string;
    order: number;
    categoryId: string;
    durationMinutes: string;
    showOnHomepage: boolean;
    accessMode: LiveStreamAccessMode;
    recordingUrl: string;
  };
};

export function LiveStreamForm({ courseOptions, categoryOptions = [], initialData }: Props) {
  const router = useRouter();
  const t = useT();
  const F = "dashboard.liveStreamForm";
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    courseId: initialData?.courseId ?? "",
    title: initialData?.title ?? "",
    titleAr: initialData?.titleAr ?? "",
    provider: (initialData?.provider ?? "zoom") as LiveStreamProvider,
    meetingUrl: initialData?.meetingUrl ?? "",
    meetingId: initialData?.meetingId ?? "",
    meetingPassword: initialData?.meetingPassword ?? "",
    scheduledAt: initialData?.scheduledAt ?? "",
    description: initialData?.description ?? "",
    order: initialData?.order ?? 0,
    categoryId: initialData?.categoryId ?? "",
    durationMinutes: initialData?.durationMinutes ?? "",
    showOnHomepage: initialData?.showOnHomepage ?? false,
    accessMode: (initialData?.accessMode ?? "course_enrolled") as LiveStreamAccessMode,
    recordingUrl: initialData?.recordingUrl ?? "",
  });

  const handleConvertToLesson = async () => {
    if (!initialData) return;
    if (!confirm(t(`${F}.convertToLesson`) + "؟")) return;
    setConverting(true);
    setError("");
    try {
      const res = await fetch(`/api/live-streams/${initialData.id}/convert-to-lesson`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t(`${F}.convertFailed`));
      alert(t(`${F}.convertSuccess`));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(`${F}.convertFailed`));
    } finally {
      setConverting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.courseId || !form.title.trim() || !form.meetingUrl.trim() || !form.scheduledAt) {
      setError(t(`${F}.validationRequired`));
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/live-streams/${initialData!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: form.courseId,
            title: form.title.trim(),
            titleAr: form.titleAr.trim() || null,
            provider: form.provider,
            meetingUrl: form.meetingUrl.trim(),
            meetingId: form.meetingId.trim() || null,
            meetingPassword: form.meetingPassword.trim() || null,
            scheduledAt: form.scheduledAt,
            description: form.description.trim() || null,
            order: form.order,
            categoryId: form.categoryId || null,
            durationMinutes: form.durationMinutes.trim() !== "" ? parseInt(form.durationMinutes, 10) : null,
            showOnHomepage: form.showOnHomepage,
            accessMode: form.accessMode,
            recordingUrl: form.recordingUrl.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || t(`${F}.saveFailedUpdate`));
        }
        router.push("/dashboard/live-streams");
        router.refresh();
      } else {
        const res = await fetch("/api/live-streams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: form.courseId,
            title: form.title.trim(),
            titleAr: form.titleAr.trim() || null,
            provider: form.provider,
            meetingUrl: form.meetingUrl.trim(),
            meetingId: form.meetingId.trim() || null,
            meetingPassword: form.meetingPassword.trim() || null,
            scheduledAt: form.scheduledAt,
            description: form.description.trim() || null,
            order: form.order,
            categoryId: form.categoryId || null,
            durationMinutes: form.durationMinutes.trim() !== "" ? parseInt(form.durationMinutes, 10) : null,
            showOnHomepage: form.showOnHomepage,
            accessMode: form.accessMode,
            recordingUrl: form.recordingUrl.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || t(`${F}.saveFailedCreate`));
        }
        router.push("/dashboard/live-streams");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t(`${F}.errorGeneric`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && (
        <p className="rounded-[var(--radius-btn)] bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelCourse`)}</label>
        <select
          value={form.courseId}
          onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          required
        >
          <option value="">{t(`${F}.selectCoursePlaceholder`)}</option>
          {courseOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelTitle`)}</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          placeholder={t(`${F}.titlePlaceholder`)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelTitleAr`)}</label>
        <input
          type="text"
          value={form.titleAr}
          onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          placeholder={t(`${F}.titleArPlaceholder`)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelProvider`)}</label>
        <select
          value={form.provider}
          onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value as LiveStreamProvider }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="zoom">Zoom</option>
          <option value="google_meet">Google Meet</option>
          <option value="youtube_live">{t(`${F}.providerYoutubeLive`)}</option>
          <option value="external">{t(`${F}.providerExternal`)}</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelCategory`)}</label>
        <select
          value={form.categoryId}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="">{t(`${F}.selectCategoryPlaceholder`)}</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelMeetingUrl`)}</label>
        <input
          type="url"
          value={form.meetingUrl}
          onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          placeholder={t(`${F}.meetingUrlPlaceholder`)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelMeetingId`)}</label>
        <input
          type="text"
          value={form.meetingId}
          onChange={(e) => setForm((f) => ({ ...f, meetingId: e.target.value }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          placeholder={t(`${F}.meetingIdPlaceholder`)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelMeetingPassword`)}</label>
        <input
          type="text"
          value={form.meetingPassword}
          onChange={(e) => setForm((f) => ({ ...f, meetingPassword: e.target.value }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          placeholder={t(`${F}.meetingPasswordPlaceholder`)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelScheduledAt`)}</label>
        <input
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelDescription`)}</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          rows={3}
          placeholder={t(`${F}.descriptionPlaceholder`)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelDurationMinutes`)}</label>
        <input
          type="number"
          min={0}
          value={form.durationMinutes}
          onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          placeholder={t(`${F}.durationMinutesPlaceholder`)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelAccessMode`)}</label>
        <select
          value={form.accessMode}
          onChange={(e) => setForm((f) => ({ ...f, accessMode: e.target.value as LiveStreamAccessMode }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          <option value="public">{t(`${F}.accessModePublic`)}</option>
          <option value="members">{t(`${F}.accessModeMembers`)}</option>
          <option value="paid">{t(`${F}.accessModePaid`)}</option>
          <option value="subscribers">{t(`${F}.accessModeSubscribers`)}</option>
          <option value="course_enrolled">{t(`${F}.accessModeCourseEnrolled`)}</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelRecordingUrl`)}</label>
        <input
          type="url"
          value={form.recordingUrl}
          onChange={(e) => setForm((f) => ({ ...f, recordingUrl: e.target.value }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          placeholder={t(`${F}.recordingUrlPlaceholder`)}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="showOnHomepage"
          type="checkbox"
          checked={form.showOnHomepage}
          onChange={(e) => setForm((f) => ({ ...f, showOnHomepage: e.target.checked }))}
          className="h-4 w-4 rounded border-[var(--color-border)]"
        />
        <label htmlFor="showOnHomepage" className="text-sm font-medium text-[var(--color-foreground)]">
          {t(`${F}.labelShowOnHomepage`)}
        </label>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">{t(`${F}.labelOrder`)}</label>
        <input
          type="number"
          min={0}
          value={form.order}
          onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))}
          className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {loading ? t(`${F}.saving`) : isEdit ? t(`${F}.saveEdit`) : t(`${F}.addStream`)}
        </button>
        {isEdit && (form.recordingUrl.trim() || form.meetingUrl.trim()) && (
          <button
            type="button"
            onClick={handleConvertToLesson}
            disabled={converting}
            className="rounded-[var(--radius-btn)] border border-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 disabled:opacity-50"
          >
            {converting ? t(`${F}.convertingToLesson`) : t(`${F}.convertToLesson`)}
          </button>
        )}
      </div>
    </form>
  );
}
