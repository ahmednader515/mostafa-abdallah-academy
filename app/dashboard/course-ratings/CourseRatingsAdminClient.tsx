"use client";

import { useCallback, useEffect, useState } from "react";
import { useT, useLocale } from "@/components/LocaleProvider";

type Row = {
  id: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  createdAt: string | Date;
  studentName: string;
  studentEmail: string | null;
  courseId: string;
  courseTitle: string;
  courseTitleAr: string | null;
};

export function CourseRatingsAdminClient({ canDelete }: { canDelete: boolean }) {
  const t = useT();
  const locale = useLocale();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [hiddenFilter, setHiddenFilter] = useState<"all" | "visible" | "hidden">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set("search", search.trim());
      if (hiddenFilter === "visible") qs.set("hidden", "false");
      if (hiddenFilter === "hidden") qs.set("hidden", "true");
      qs.set("limit", "100");
      const res = await fetch(`/api/dashboard/course-ratings?${qs.toString()}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t("dashboard.courseRatings.loadFailed", "Failed to load ratings"));
        return;
      }
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setTotal(Number(data.total ?? 0));
    } catch {
      setError(t("dashboard.courseRatings.loadFailed", "Failed to load ratings"));
    } finally {
      setLoading(false);
    }
  }, [search, hiddenFilter, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleHidden(id: string, isHidden: boolean) {
    setBusyId(id);
    try {
      const res = await fetch("/api/dashboard/course-ratings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isHidden: !isHidden }),
      });
      if (res.ok) await load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!canDelete) return;
    if (!confirm(t("dashboard.courseRatings.confirmDelete", "Delete this rating permanently?"))) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/dashboard/course-ratings?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) await load();
    } finally {
      setBusyId(null);
    }
  }

  function formatDate(d: string | Date) {
    const date = typeof d === "string" ? new Date(d) : d;
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="block text-sm font-medium text-[var(--color-foreground)]">
            {t("dashboard.courseRatings.search", "Search")}
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("dashboard.courseRatings.searchPh", "Student, course, or comment…")}
            className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)]">
            {t("dashboard.courseRatings.filter", "Visibility")}
          </label>
          <select
            value={hiddenFilter}
            onChange={(e) => setHiddenFilter(e.target.value as typeof hiddenFilter)}
            className="mt-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          >
            <option value="all">{t("dashboard.courseRatings.filterAll", "All")}</option>
            <option value="visible">{t("dashboard.courseRatings.filterVisible", "Visible")}</option>
            <option value="hidden">{t("dashboard.courseRatings.filterHidden", "Hidden")}</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm"
        >
          {t("dashboard.courseRatings.refresh", "Refresh")}
        </button>
      </div>

      <p className="text-sm text-[var(--color-muted)]">
        {t("dashboard.courseRatings.total", "Total")}: {total}
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-surface)] text-start">
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-3 py-3 font-semibold">{t("dashboard.courseRatings.colStudent", "Student")}</th>
              <th className="px-3 py-3 font-semibold">{t("dashboard.courseRatings.colCourse", "Course")}</th>
              <th className="px-3 py-3 font-semibold">{t("dashboard.courseRatings.colStars", "Stars")}</th>
              <th className="px-3 py-3 font-semibold">{t("dashboard.courseRatings.colComment", "Comment")}</th>
              <th className="px-3 py-3 font-semibold">{t("dashboard.courseRatings.colDate", "Date")}</th>
              <th className="px-3 py-3 font-semibold">{t("dashboard.courseRatings.colStatus", "Status")}</th>
              <th className="px-3 py-3 font-semibold">{t("dashboard.courseRatings.colActions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-[var(--color-muted)]">
                  {t("dashboard.courseRatings.loading", "Loading…")}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-[var(--color-muted)]">
                  {t("dashboard.courseRatings.empty", "No ratings yet")}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium text-[var(--color-foreground)]">{r.studentName}</div>
                    {r.studentEmail ? (
                      <div className="text-xs text-[var(--color-muted)]">{r.studentEmail}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-[var(--color-foreground)]">
                    {locale === "ar" ? r.courseTitleAr || r.courseTitle : r.courseTitle}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-amber-600">
                    {"★".repeat(r.rating)}
                    <span className="ms-1 text-[var(--color-muted)]">({r.rating})</span>
                  </td>
                  <td className="max-w-xs px-3 py-3 text-[var(--color-foreground)]">
                    {r.comment || (
                      <span className="text-[var(--color-muted)]">
                        {t("dashboard.courseRatings.noComment", "—")}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-[var(--color-muted)]">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    {r.isHidden ? (
                      <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                        {t("dashboard.courseRatings.hidden", "Hidden")}
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                        {t("dashboard.courseRatings.visible", "Visible")}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => void toggleHidden(r.id, r.isHidden)}
                        className="text-[var(--color-primary)] hover:underline disabled:opacity-50"
                      >
                        {r.isHidden
                          ? t("dashboard.courseRatings.show", "Show")
                          : t("dashboard.courseRatings.hide", "Hide")}
                      </button>
                      {canDelete ? (
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => void handleDelete(r.id)}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          {t("dashboard.courseRatings.delete", "Delete")}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
