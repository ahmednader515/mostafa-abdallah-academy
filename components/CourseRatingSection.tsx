"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import { fillMessage } from "@/lib/i18n/interpolate";

type RatingSummary = {
  courseId: string;
  averageRating: number | null;
  ratingCount: number;
  userRating: number | null;
  userComment: string | null;
};

export function CourseRatingSection({
  courseId,
  canRate,
}: {
  courseId: string;
  canRate: boolean;
}) {
  const t = useT();
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/courses/${encodeURIComponent(courseId)}/rating`, { credentials: "include" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          summary?: RatingSummary;
        };
        if (!res.ok) throw new Error(data.error || t("courses.courseRatingLoadFailed", "Failed to load ratings"));
        return data.summary ?? null;
      })
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
          setComment(data?.userComment ?? "");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t("courses.courseRatingLoadFailed", "Failed to load ratings"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, t]);

  async function handleSubmit(nextRating?: number) {
    const rating = nextRating ?? summary?.userRating;
    if (!rating || rating < 1 || rating > 5) {
      setError(t("courses.courseRatingPickStars", "Please select a star rating"));
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess("");
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        summary?: RatingSummary;
      };
      if (!res.ok) {
        setError(data.error || t("courses.courseRatingSaveFailed", "Failed to save your rating"));
        return;
      }
      if (data.summary) {
        setSummary(data.summary);
        setComment(data.summary.userComment ?? "");
      }
      setSuccess(t("courses.courseRatingSaved", "Your rating was saved"));
    } catch {
      setError(t("courses.courseRatingSaveFailed", "Failed to save your rating"));
    } finally {
      setBusy(false);
    }
  }

  if (!canRate && !loading && (!summary || summary.ratingCount === 0)) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
          {t("courses.rateCourseTitle", "Rate this course")}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {canRate
            ? t("courses.rateCourseSubtitle", "Share your experience to help other learners.")
            : t("courses.rateCourseEnrolledOnly", "Only enrolled students can rate this course.")}
        </p>
      </div>

      {summary && summary.ratingCount > 0 ? (
        <p className="text-sm text-[var(--color-foreground)]">
          {fillMessage(
            t("courses.courseRatingAverageLine", "Course rating: {rating}/5 ({count} ratings)"),
            {
              rating: String(summary.averageRating ?? "—"),
              count: String(summary.ratingCount),
            }
          )}
        </p>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          {t("courses.noCourseRatingsYet", "No course ratings yet")}
        </p>
      )}

      {canRate ? (
        <>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => {
              const selected = (summary?.userRating ?? 0) >= value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSummary((s) =>
                      s
                        ? { ...s, userRating: value }
                        : {
                            courseId,
                            averageRating: null,
                            ratingCount: 0,
                            userRating: value,
                            userComment: comment,
                          }
                    );
                    void handleSubmit(value);
                  }}
                  disabled={busy || loading}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-2xl leading-none transition ${
                    selected
                      ? "border-amber-500 bg-amber-500/15 text-amber-500"
                      : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted)]"
                  } disabled:opacity-60`}
                  aria-label={fillMessage(t("courses.rateStarsAria", "Rate {n} stars"), { n: value })}
                >
                  ★
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {t("courses.courseRatingCommentLabel", "Comment (optional)")}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 1000))}
              rows={3}
              maxLength={1000}
              placeholder={t("courses.courseRatingCommentPlaceholder", "Write your feedback…")}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              disabled={busy || loading}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={busy || loading || !summary?.userRating}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
          >
            {busy
              ? t("courses.courseRatingSaving", "Saving…")
              : t("courses.courseRatingSubmit", "Submit rating")}
          </button>
        </>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}
    </section>
  );
}
