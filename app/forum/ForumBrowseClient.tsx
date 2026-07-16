"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

type CategoryOpt = { id: string; name: string; description: string | null };
type ThreadRow = {
  id: string;
  title: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  lastReplyAt: string | null;
};

export function ForumBrowseClient({
  categories,
  threads,
  activeCategoryId,
  locale,
}: {
  categories: CategoryOpt[];
  threads: ThreadRow[];
  activeCategoryId: string | null;
  locale: string;
}) {
  const t = useT();
  const router = useRouter();
  const dateLocale = locale === "en" ? "en-US" : "ar-EG";

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {t("forum.categories", "Categories")}
        </p>
        <button
          type="button"
          onClick={() => router.push("/forum")}
          className={`block w-full rounded-[var(--radius-btn)] px-3 py-2 text-start text-sm font-medium ${
            !activeCategoryId
              ? "bg-[var(--color-primary)] text-white"
              : "border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]/30"
          }`}
        >
          {t("forum.allCategories", "All")}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => router.push(`/forum?category=${encodeURIComponent(c.id)}`)}
            className={`block w-full rounded-[var(--radius-btn)] px-3 py-2 text-start text-sm font-medium ${
              activeCategoryId === c.id
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]/30"
            }`}
          >
            {c.name}
          </button>
        ))}
      </aside>

      <div>
        {threads.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
            <p className="text-[var(--color-muted)]">
              {t("forum.empty", "No topics yet. Be the first to start a discussion.")}
            </p>
            <Link
              href="/forum/new"
              className="mt-6 inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t("forum.newThread", "New topic")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {threads.map((th) => (
              <li key={th.id}>
                <Link
                  href={`/forum/${encodeURIComponent(th.id)}`}
                  className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition hover:border-[var(--color-primary)]/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {th.isPinned ? (
                      <span className="rounded-full bg-[#F59E0B]/15 px-2 py-0.5 text-xs font-semibold text-[#F59E0B]">
                        {t("forum.pinned", "Pinned")}
                      </span>
                    ) : null}
                    {th.isLocked ? (
                      <span className="rounded-full bg-[var(--color-muted)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--color-muted)]">
                        {t("forum.locked", "Locked")}
                      </span>
                    ) : null}
                    <span className="text-xs text-[var(--color-muted)]">{th.categoryName}</span>
                  </div>
                  <h2 className="mt-1 text-base font-bold text-[var(--color-foreground)]">{th.title}</h2>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {th.authorName} · {formatDate(th.lastReplyAt || th.createdAt)} ·{" "}
                    {th.replyCount} {t("forum.replies", "replies")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
