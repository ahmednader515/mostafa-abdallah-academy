"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { useDashboardTable, dateLocaleForUi } from "@/lib/i18n/dashboard-table";
import { fillMessage } from "@/lib/i18n/interpolate";

type CodeRow = {
  id: string;
  courseId: string;
  planId?: string | null;
  targetType?: "course" | "subscription";
  code: string;
  createdAt: string;
  usedAt: string | null;
  usedByUserId: string | null;
  courseTitle?: string;
  courseTitleAr?: string;
  planName?: string | null;
  lessonCount?: number | null;
  quizCount?: number | null;
  expiresAt?: string | null;
  maxUses?: number;
  usedCount?: number;
};

type TargetType = "course" | "subscription";

type CodesManageProps = {
  courseOptions: { id: string; title: string }[];
  planOptions?: { id: string; name: string }[];
  allowSubscriptionCodes?: boolean;
};

function getMaxUses(row: CodeRow): number {
  return row.maxUses ?? 1;
}

function getUsedCount(row: CodeRow): number {
  if (row.usedCount != null) return row.usedCount;
  if (row.usedAt) return 1;
  return 0;
}

function getCodeStatus(row: CodeRow): "used" | "expired" | "available" {
  const maxUses = getMaxUses(row);
  const usedCount = getUsedCount(row);
  const isUsed = usedCount >= maxUses || (!!row.usedAt && maxUses <= 1);
  if (isUsed) return "used";
  if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
    return "expired";
  }
  return "available";
}

function isAvailable(row: CodeRow): boolean {
  return getCodeStatus(row) === "available";
}

function targetName(row: CodeRow): string {
  if (row.targetType === "subscription") {
    return row.planName ?? row.planId ?? "—";
  }
  return row.courseTitleAr ?? row.courseTitle ?? row.courseId ?? "—";
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function CodesManage({
  courseOptions,
  planOptions = [],
  allowSubscriptionCodes = false,
}: CodesManageProps) {
  const router = useRouter();
  const t = useT();
  const M = "dashboard.codesManage";
  const { locale, dir, thClassCompact } = useDashboardTable();
  const dateLocale = dateLocaleForUi(locale);

  const showSubscriptionOption =
    allowSubscriptionCodes && planOptions.length > 0;

  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCourseId, setFilterCourseId] = useState<string>("");
  const [searchCode, setSearchCode] = useState("");
  const [generating, setGenerating] = useState(false);

  const [targetType, setTargetType] = useState<TargetType>("course");
  const [createCourseId, setCreateCourseId] = useState("");
  const [createPlanId, setCreatePlanId] = useState("");
  const [createCount, setCreateCount] = useState(5);
  const [createMaxUses, setCreateMaxUses] = useState(1);
  const [createExpiresAt, setCreateExpiresAt] = useState("");

  const [courseLessons, setCourseLessons] = useState<
    Array<{ id: string; title: string; titleAr: string | null; order: number }>
  >([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(
    new Set(),
  );
  const [courseQuizzes, setCourseQuizzes] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [selectedQuizIds, setSelectedQuizIds] = useState<Set<string>>(
    new Set(),
  );

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copySuccess, setCopySuccess] = useState(false);

  const latestCreatedAtMs = useMemo(() => {
    if (!codes.length) return null;
    let max = 0;
    for (const c of codes) {
      const ts = new Date(c.createdAt).getTime();
      if (Number.isFinite(ts) && ts > max) max = ts;
    }
    return max || null;
  }, [codes]);

  function isNewestBatch(createdAt: string): boolean {
    if (!latestCreatedAtMs) return false;
    const ts = new Date(createdAt).getTime();
    if (!Number.isFinite(ts)) return false;
    return Math.abs(latestCreatedAtMs - ts) <= 2000;
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredCodes = useMemo(() => {
    const q = searchCode.trim().toLowerCase();
    if (!q) return codes;
    return codes.filter((c) => (c.code ?? "").toLowerCase().includes(q));
  }, [codes, searchCode]);

  const exportRows = useMemo(() => {
    if (selectedIds.size > 0) {
      return filteredCodes.filter((c) => selectedIds.has(c.id));
    }
    return filteredCodes;
  }, [filteredCodes, selectedIds]);

  function toggleSelectAll() {
    if (selectedIds.size === filteredCodes.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredCodes.map((c) => c.id)));
  }

  function load() {
    setLoading(true);
    setError("");
    const url = filterCourseId
      ? `/api/dashboard/codes?courseId=${encodeURIComponent(filterCourseId)}`
      : "/api/dashboard/codes";
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(t(`${M}.fetchFailed`, "Failed to fetch codes"));
        return res.json();
      })
      .then((data) => setCodes(Array.isArray(data) ? data : []))
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : t(`${M}.genericError`, "Something went wrong"),
        ),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [filterCourseId]);

  useEffect(() => {
    if (targetType !== "course") return;
    const cid = createCourseId.trim();
    if (!cid) {
      setCourseLessons([]);
      setSelectedLessonIds(new Set());
      setCourseQuizzes([]);
      setSelectedQuizIds(new Set());
      return;
    }
    setLessonsLoading(true);
    fetch(`/api/dashboard/courses/${encodeURIComponent(cid)}/lessons`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data.error ?? t(`${M}.fetchLessonsFailed`, "Failed to fetch lessons"),
          );
        }
        return data;
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCourseLessons(list);
        setSelectedLessonIds((prev) => {
          const allowed = new Set(list.map((l: { id: string }) => l.id));
          const next = new Set<string>();
          prev.forEach((id) => {
            if (allowed.has(id)) next.add(id);
          });
          return next;
        });
      })
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : t(`${M}.fetchLessonsError`, "Failed to load lessons"),
        ),
      )
      .finally(() => setLessonsLoading(false));
  }, [createCourseId, targetType]);

  useEffect(() => {
    if (targetType !== "course") return;
    const cid = createCourseId.trim();
    if (!cid) {
      setCourseQuizzes([]);
      setSelectedQuizIds(new Set());
      return;
    }
    setQuizzesLoading(true);
    fetch(`/api/dashboard/courses/${encodeURIComponent(cid)}/quizzes`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data.error ?? t(`${M}.fetchQuizzesFailed`, "Failed to fetch quizzes"),
          );
        }
        return data;
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCourseQuizzes(list);
        setSelectedQuizIds((prev) => {
          const allowed = new Set(list.map((q: { id: string }) => q.id));
          const next = new Set<string>();
          prev.forEach((id) => {
            if (allowed.has(id)) next.add(id);
          });
          return next;
        });
      })
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : t(`${M}.fetchQuizzesError`, "Failed to load quizzes"),
        ),
      )
      .finally(() => setQuizzesLoading(false));
  }, [createCourseId, targetType]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (targetType === "course" && !createCourseId.trim()) {
      setError(t(`${M}.pickCourse`, "Choose a course"));
      return;
    }
    if (targetType === "subscription" && !createPlanId.trim()) {
      setError(t(`${M}.pickPlan`, "Choose a subscription plan"));
      return;
    }

    const count = Math.min(500, Math.max(1, createCount));
    const maxUses = Math.max(1, Math.floor(createMaxUses) || 1);
    const expiresAt = createExpiresAt.trim()
      ? new Date(createExpiresAt).toISOString()
      : null;

    setGenerating(true);
    try {
      const body: Record<string, unknown> = {
        targetType,
        count,
        maxUses,
        expiresAt,
      };

      if (targetType === "course") {
        body.courseId = createCourseId.trim();
        if (selectedLessonIds.size > 0) {
          body.lessonIds = Array.from(selectedLessonIds);
        }
        if (selectedQuizIds.size > 0) {
          body.quizIds = Array.from(selectedQuizIds);
        }
      } else {
        body.planId = createPlanId.trim();
      }

      const res = await fetch("/api/dashboard/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? t(`${M}.generateFailed`, "Failed to create codes"));
      }

      setCreateCount(5);
      setCreateMaxUses(1);
      setCreateExpiresAt("");
      setSelectedLessonIds(new Set());
      setSelectedQuizIds(new Set());
      router.refresh();
      load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t(`${M}.generateFailed`, "Failed to create codes"),
      );
    } finally {
      setGenerating(false);
    }
  }

  function copyCodes(rows: CodeRow[]) {
    const text = rows.map((c) => c.code).join("\n");
    if (!text) {
      setError(t(`${M}.noCodesToCopy`, "No codes to copy"));
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(true);
        setError("");
        setTimeout(() => setCopySuccess(false), 2000);
      },
      () => setError(t(`${M}.copyFailed`, "Copy failed")),
    );
  }

  function copyAllUnused() {
    const unused = filteredCodes.filter(isAvailable);
    if (unused.length === 0) {
      setError(t(`${M}.noUnusedToCopy`, "No unused codes to copy"));
      return;
    }
    copyCodes(unused);
  }

  function copyAll() {
    copyCodes(filteredCodes);
  }

  function exportCsv() {
    if (exportRows.length === 0) {
      setError(t(`${M}.noRowsToExport`, "No codes to export"));
      return;
    }

    const header =
      "code,targetType,targetName,usedCount,maxUses,expiresAt,createdAt,status";
    const lines = exportRows.map((row) => {
      const tt = row.targetType ?? "course";
      const status = getCodeStatus(row);
      const expires = row.expiresAt
        ? new Date(row.expiresAt).toISOString()
        : "";
      const created = row.createdAt
        ? new Date(row.createdAt).toISOString()
        : "";
      return [
        csvEscape(row.code),
        csvEscape(tt),
        csvEscape(targetName(row)),
        String(getUsedCount(row)),
        String(getMaxUses(row)),
        csvEscape(expires),
        csvEscape(created),
        csvEscape(status),
      ].join(",");
    });

    const blob = new Blob([[header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activation-codes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setError("");
  }

  function handleDelete(id: string) {
    if (confirmDeleteIds.has(id)) {
      setDeletingIds((prev) => new Set(prev).add(id));
      fetch("/api/dashboard/codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      })
        .then((res) => res.json().catch(() => ({})))
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setConfirmDeleteIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          router.refresh();
          load();
        })
        .catch((e) =>
          alert(
            e instanceof Error
              ? e.message
              : t(`${M}.deleteFailed`, "Delete failed"),
          ),
        )
        .finally(() =>
          setDeletingIds((prev) => {
            const s = new Set(prev);
            s.delete(id);
            return s;
          }),
        );
      return;
    }
    setConfirmDeleteIds((prev) => new Set(prev).add(id));
  }

  function handleBulkDelete(ids: string[]) {
    if (ids.length === 0) return;
    if (
      !confirm(
        fillMessage(
          t(`${M}.bulkDeleteConfirm`, "Permanently delete {count} code(s)?"),
          { count: ids.length },
        ),
      )
    ) {
      return;
    }
    setDeletingIds((prev) => new Set([...prev, ...ids]));
    fetch("/api/dashboard/codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setConfirmDeleteIds(new Set());
        setSelectedIds(new Set());
        router.refresh();
        load();
      })
      .catch((e) =>
        alert(
          e instanceof Error
            ? e.message
            : t(`${M}.deleteFailed`, "Delete failed"),
        ),
      )
      .finally(() =>
        setDeletingIds((prev) => {
          const s = new Set(prev);
          ids.forEach((id) => s.delete(id));
          return s;
        }),
      );
  }

  function scopeLabel(row: CodeRow): string {
    if (row.targetType === "subscription") {
      return t(`${M}.scopeSubscription`, "Full subscription plan");
    }
    const lc = row.lessonCount ?? 0;
    const qc = row.quizCount ?? 0;
    if (lc === 0 && qc === 0) {
      return t(`${M}.scopeFullCourse`, "Full course");
    }
    if (lc > 0 && qc > 0) {
      return fillMessage(
        t(`${M}.scopeLessonsPlusQuizzes`, "Lessons ({lc}) + quizzes ({qc})"),
        { lc, qc },
      );
    }
    if (lc > 0) {
      return fillMessage(
        t(`${M}.scopeLessonsOnly`, "Selected lessons ({count})"),
        { count: lc },
      );
    }
    return fillMessage(
      t(`${M}.scopeQuizzesOnly`, "Selected quizzes ({count})"),
      { count: qc },
    );
  }

  function statusLabel(row: CodeRow): { text: string; className: string } {
    const status = getCodeStatus(row);
    if (status === "used") {
      return {
        text: t(`${M}.statusUsed`, "Used"),
        className: "text-amber-600 dark:text-amber-400",
      };
    }
    if (status === "expired") {
      return {
        text: t(`${M}.statusExpired`, "Expired"),
        className: "text-red-600 dark:text-red-400",
      };
    }
    return {
      text: t(`${M}.statusAvailable`, "Available"),
      className: "text-green-600 dark:text-green-400",
    };
  }

  const unusedCodes = filteredCodes.filter(isAvailable);
  const selectedForBulkDelete =
    selectedIds.size > 0 ? Array.from(selectedIds) : [];
  const dash = t("dashboard.studentsPage.dash", "—");

  if (loading) {
    return (
      <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-muted)]">
        {t(`${M}.loading`, "Loading...")}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : null}
      {copySuccess ? (
        <div className="rounded-[var(--radius-btn)] bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          {t(`${M}.copiedToast`, "Codes copied to clipboard")}
        </div>
      ) : null}

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${M}.sectionCreate`, "Create new codes")}
        </h3>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            {showSubscriptionOption ? (
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  {t(`${M}.labelTargetType`, "Target type")}
                </label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    const next = e.target.value as TargetType;
                    setTargetType(next);
                    if (next === "subscription") {
                      setCreateCourseId("");
                      setSelectedLessonIds(new Set());
                      setSelectedQuizIds(new Set());
                    } else {
                      setCreatePlanId("");
                    }
                  }}
                  className="mt-1 min-w-[180px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                >
                  <option value="course">
                    {t(`${M}.targetCourse`, "Course")}
                  </option>
                  <option value="subscription">
                    {t(`${M}.targetSubscription`, "Subscription")}
                  </option>
                </select>
              </div>
            ) : null}

            {targetType === "course" ? (
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  {t(`${M}.labelCourse`, "Course")}
                </label>
                <select
                  value={createCourseId}
                  onChange={(e) => setCreateCourseId(e.target.value)}
                  className="mt-1 min-w-[200px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                >
                  <option value="">
                    {t(`${M}.selectCoursePlaceholder`, "— Choose a course —")}
                  </option>
                  {courseOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  {t(`${M}.labelPlan`, "Subscription plan")}
                </label>
                <select
                  value={createPlanId}
                  onChange={(e) => setCreatePlanId(e.target.value)}
                  className="mt-1 min-w-[200px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                >
                  <option value="">
                    {t(`${M}.selectPlanPlaceholder`, "— Choose a plan —")}
                  </option>
                  {planOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                {t(`${M}.labelCount`, "Number of codes (1–500)")}
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={createCount}
                onChange={(e) => setCreateCount(Number(e.target.value) || 1)}
                className="mt-1 w-24 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                {t(`${M}.labelMaxUses`, "Max uses per code")}
              </label>
              <input
                type="number"
                min={1}
                value={createMaxUses}
                onChange={(e) => setCreateMaxUses(Number(e.target.value) || 1)}
                className="mt-1 w-24 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                {t(`${M}.labelExpiresAt`, "Expires at (optional)")}
              </label>
              <input
                type="datetime-local"
                value={createExpiresAt}
                onChange={(e) => setCreateExpiresAt(e.target.value)}
                className="mt-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {generating
                ? t(`${M}.generating`, "Creating...")
                : t(`${M}.generateButton`, "Create codes")}
            </button>
          </div>

          {targetType === "course" ? (
            <div className="min-w-[260px] max-w-xl">
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                {t(`${M}.labelScopeOptional`, "Code scope (optional)")}
              </label>
              <div className="mt-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm">
                {!createCourseId ? (
                  <span className="text-[var(--color-muted)]">
                    {t(`${M}.chooseCourseHint`, "Select a course first to see content.")}
                  </span>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-[var(--color-muted)]">
                      {t(
                        `${M}.scopeIntro`,
                        "Leave unchecked to unlock the full course. Or pick lessons/quizzes for specific content only.",
                      )}
                    </p>

                    <div>
                      <p className="mb-1 text-xs font-semibold text-[var(--color-foreground)]">
                        {t(`${M}.lessonsHeading`, "Lessons")}
                      </p>
                      {lessonsLoading ? (
                        <span className="text-[var(--color-muted)]">
                          {t(`${M}.loadingLessons`, "Loading lessons...")}
                        </span>
                      ) : courseLessons.length === 0 ? (
                        <span className="text-[var(--color-muted)]">
                          {t(`${M}.noLessonsInCourse`, "No lessons in this course.")}
                        </span>
                      ) : (
                        <>
                          <div className="max-h-32 space-y-1 overflow-auto pr-1">
                            {courseLessons.map((l) => {
                              const title = l.titleAr ?? l.title;
                              const checked = selectedLessonIds.has(l.id);
                              return (
                                <label
                                  key={l.id}
                                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-[var(--color-border)]/30"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      setSelectedLessonIds((prev) => {
                                        const next = new Set(prev);
                                        if (e.target.checked) next.add(l.id);
                                        else next.delete(l.id);
                                        return next;
                                      });
                                    }}
                                    className="rounded border-[var(--color-border)]"
                                  />
                                  <span className="truncate" title={title}>
                                    {title}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedLessonIds(
                                  new Set(courseLessons.map((l) => l.id)),
                                )
                              }
                              className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-border)]/30"
                            >
                              {t(`${M}.selectAllLessons`, "Select all lessons")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedLessonIds(new Set())}
                              className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-border)]/30"
                            >
                              {t(`${M}.clearLessonSelection`, "Clear selection")}
                            </button>
                            {selectedLessonIds.size > 0 ? (
                              <span className="text-xs text-[var(--color-muted)]">
                                {fillMessage(
                                  t(
                                    `${M}.lessonsSelectedCount`,
                                    "{count} lesson(s) selected",
                                  ),
                                  { count: selectedLessonIds.size },
                                )}
                              </span>
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold text-[var(--color-foreground)]">
                        {t(`${M}.quizzesHeading`, "Quizzes")}
                      </p>
                      {quizzesLoading ? (
                        <span className="text-[var(--color-muted)]">
                          {t(`${M}.loadingQuizzes`, "Loading quizzes...")}
                        </span>
                      ) : courseQuizzes.length === 0 ? (
                        <span className="text-[var(--color-muted)]">
                          {t(`${M}.noQuizzesInCourse`, "No quizzes in this course.")}
                        </span>
                      ) : (
                        <>
                          <div className="max-h-32 space-y-1 overflow-auto pr-1">
                            {courseQuizzes.map((q) => {
                              const checked = selectedQuizIds.has(q.id);
                              return (
                                <label
                                  key={q.id}
                                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-[var(--color-border)]/30"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      setSelectedQuizIds((prev) => {
                                        const next = new Set(prev);
                                        if (e.target.checked) next.add(q.id);
                                        else next.delete(q.id);
                                        return next;
                                      });
                                    }}
                                    className="rounded border-[var(--color-border)]"
                                  />
                                  <span className="truncate" title={q.title}>
                                    {q.title}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedQuizIds(
                                  new Set(courseQuizzes.map((q) => q.id)),
                                )
                              }
                              className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-border)]/30"
                            >
                              {t(`${M}.selectAllQuizzes`, "Select all quizzes")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedQuizIds(new Set())}
                              className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-border)]/30"
                            >
                              {t(`${M}.clearQuizSelection`, "Clear selection")}
                            </button>
                            {selectedQuizIds.size > 0 ? (
                              <span className="text-xs text-[var(--color-muted)]">
                                {fillMessage(
                                  t(
                                    `${M}.quizzesSelectedCount`,
                                    "{count} quiz(zes) selected",
                                  ),
                                  { count: selectedQuizIds.size },
                                )}
                              </span>
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </form>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-background)]/50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {searchCode.trim()
                ? fillMessage(
                    t(
                      `${M}.listTitleFiltered`,
                      "Code list ({filtered} of {total})",
                    ),
                    { filtered: filteredCodes.length, total: codes.length },
                  )
                : fillMessage(
                    t(`${M}.listTitle`, "Code list ({count})"),
                    { count: filteredCodes.length },
                  )}
            </h3>
            <input
              type="search"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder={t(`${M}.searchPlaceholderCode`, "Search code...")}
              className="min-w-[160px] max-w-[220px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <select
              value={filterCourseId}
              onChange={(e) => setFilterCourseId(e.target.value)}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm"
            >
              <option value="">
                {t(`${M}.allCourses`, "All courses")}
              </option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={copyAllUnused}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-background)]"
            >
              {fillMessage(
                t(`${M}.copyUnused`, "Copy unused codes ({count})"),
                { count: unusedCodes.length },
              )}
            </button>
            <button
              type="button"
              onClick={copyAll}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-background)]"
            >
              {t(`${M}.copyAllCodes`, "Copy all codes")}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-background)]"
            >
              {t(`${M}.exportCsv`, "Export CSV")}
            </button>
            {selectedForBulkDelete.length > 0 ? (
              <button
                type="button"
                onClick={() => handleBulkDelete(selectedForBulkDelete)}
                className="rounded-[var(--radius-btn)] bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                {fillMessage(
                  t(`${M}.deleteSelected`, "Delete selected ({count})"),
                  { count: selectedForBulkDelete.length },
                )}
              </button>
            ) : null}
          </div>
        </div>

        {codes.length === 0 ? (
          <p className="p-8 text-center text-[var(--color-muted)]">
            {t(
              `${M}.emptyNoCodes`,
              "No codes yet. Generate codes using the form above.",
            )}
          </p>
        ) : filteredCodes.length === 0 ? (
          <p className="p-8 text-center text-[var(--color-muted)]">
            {t(`${M}.emptyNoFiltered`, "No codes match your search.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir={dir}>
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/30">
                  <th className="p-2">
                    <input
                      type="checkbox"
                      checked={
                        filteredCodes.length > 0 &&
                        selectedIds.size === filteredCodes.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-[var(--color-border)]"
                    />
                  </th>
                  <th className={thClassCompact}>
                    {t(`${M}.colCode`, "Code")}
                  </th>
                  <th className={thClassCompact}>
                    {t(`${M}.colTarget`, "Target")}
                  </th>
                  <th className={thClassCompact}>
                    {t(`${M}.colScopeStatus`, "Scope / status")}
                  </th>
                  <th className={thClassCompact}>
                    {t(`${M}.colCreated`, "Created")}
                  </th>
                  <th className={thClassCompact}>
                    {t(`${M}.colActions`, "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((row) => {
                  const status = statusLabel(row);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--color-border)]"
                    >
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          className="rounded border-[var(--color-border)]"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[var(--color-foreground)]">
                            {row.code}
                          </span>
                          {isNewestBatch(row.createdAt) ? (
                            <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-300">
                              {t(`${M}.batchNew`, "New")}
                            </span>
                          ) : (
                            <span className="rounded bg-[var(--color-muted)]/20 px-1.5 py-0.5 text-xs text-[var(--color-muted)]">
                              {t(`${M}.batchOld`, "Old")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-[var(--color-foreground)]">
                        <div>
                          {targetName(row)}
                          {row.targetType === "subscription" ? (
                            <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
                              {t(`${M}.targetTypeSubscription`, "Subscription")}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="space-y-1">
                          <p className="text-[var(--color-muted)]">
                            {scopeLabel(row)}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            {fillMessage(
                              t(`${M}.usageLabel`, "{used}/{max} uses"),
                              {
                                used: getUsedCount(row),
                                max: getMaxUses(row),
                              },
                            )}
                          </p>
                          <span className={status.className}>{status.text}</span>
                          {row.expiresAt ? (
                            <p className="text-xs text-[var(--color-muted)]">
                              {t(`${M}.expiresLabel`, "Expires")}:{" "}
                              {new Date(row.expiresAt).toLocaleString(dateLocale)}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-2 text-[var(--color-muted)]">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString(dateLocale)
                          : dash}
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          disabled={deletingIds.has(row.id)}
                          className={
                            confirmDeleteIds.has(row.id)
                              ? "font-medium text-red-600 hover:underline"
                              : "text-red-600 hover:underline disabled:opacity-50"
                          }
                        >
                          {deletingIds.has(row.id)
                            ? t(`${M}.rowDeleting`, "Deleting...")
                            : confirmDeleteIds.has(row.id)
                              ? t(
                                  "dashboard.coursesList.clickAgainDelete",
                                  "Click again to delete",
                                )
                              : t(`${M}.colDelete`, "Delete")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
