"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ForumCategoryIcon } from "@/components/ForumCategoryIcon";
import { useLocale, useT } from "@/components/LocaleProvider";

type CategoryOpt = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  isPinned: boolean;
  isLocked: boolean;
  threadCount: number;
};

type ThreadRow = {
  id: string;
  title: string;
  body: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  lastReplyAt: string | null;
};

type SortKey = "newest" | "oldest" | "replies";

const PAGE_SIZE = 8;

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function ForumBrowseClient({
  categories,
  threads,
  isLoggedIn,
}: {
  categories: CategoryOpt[];
  threads: ThreadRow[];
  isLoggedIn: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "ar-EG";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [categoryId, setCategoryId] = useState("all");
  const [page, setPage] = useState(1);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = threads;
    if (categoryId !== "all") list = list.filter((th) => th.categoryId === categoryId);
    if (q) {
      list = list.filter((th) => {
        const hay = `${th.title} ${th.body} ${th.authorName} ${th.categoryName}`.toLowerCase();
        return hay.includes(q);
      });
    }
    list = [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (sort === "oldest") return +new Date(a.createdAt) - +new Date(b.createdAt);
      if (sort === "replies") {
        return (b.replyCount ?? 0) - (a.replyCount ?? 0) || +new Date(b.createdAt) - +new Date(a.createdAt);
      }
      const aAct = +(a.lastReplyAt || a.createdAt);
      const bAct = +(b.lastReplyAt || b.createdAt);
      return bAct - aAct;
    });
    return list;
  }, [threads, query, sort, categoryId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const sidebarCategories = showAllCategories ? categories : categories.slice(0, 6);

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      const now = new Date();
      const sameWeek =
        Math.abs(now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000 &&
        now.getDay() !== d.getDay();
      if (sameWeek || Math.abs(now.getTime() - d.getTime()) < 6 * 24 * 60 * 60 * 1000) {
        return d.toLocaleDateString(dateLocale, { weekday: "short" });
      }
      return d.toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  }

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, 2, 3, totalPages, currentPage]);
    return [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-[#F8F9FB]" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#001a3d] text-white shadow-sm">
              <ForumCategoryIcon name="chat" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-[#1A1A1A] sm:text-3xl">
                {t("forum.pageTitle", "Forum")}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-[#666666]">
                {t(
                  "forum.pageSubtitle",
                  "Share, learn, and benefit from others' experiences",
                )}
              </p>
            </div>
          </div>
          {isLoggedIn ? (
            <Link
              href="/forum/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0056D2] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0046ad]"
            >
              <span aria-hidden>+</span>
              {t("forum.newThread", "Create new topic")}
            </Link>
          ) : (
            <Link
              href="/login?callbackUrl=/forum/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0056D2] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0046ad]"
            >
              {t("forum.loginToPost", "Log in to post")}
            </Link>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-[#999]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="m16 16 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={t("forum.searchPlaceholder", "Search the forum...")}
              className="w-full rounded-lg border border-[#E8ECF2] bg-[#F8F9FB] py-2.5 pe-3 ps-10 text-sm text-[#1A1A1A] outline-none focus:border-[#0056D2]"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            className="rounded-lg border border-[#E8ECF2] bg-white px-3 py-2.5 text-sm text-[#1A1A1A]"
          >
            <option value="newest">{t("forum.sortNewest", "Newest")}</option>
            <option value="oldest">{t("forum.sortOldest", "Oldest")}</option>
            <option value="replies">{t("forum.sortReplies", "Most replies")}</option>
          </select>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[#E8ECF2] bg-white px-3 py-2.5 text-sm text-[#1A1A1A]"
          >
            <option value="all">{t("forum.allCategories", "All sections")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0 space-y-3">
            {pageItems.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <p className="text-sm text-[#666666]">
                  {t("forum.empty", "No topics yet. Be the first to start a discussion.")}
                </p>
                {isLoggedIn ? (
                  <Link
                    href="/forum/new"
                    className="mt-5 inline-flex rounded-xl bg-[#0056D2] px-5 py-2.5 text-sm font-bold text-white"
                  >
                    {t("forum.newThread", "Create new topic")}
                  </Link>
                ) : null}
              </div>
            ) : (
              pageItems.map((th) => (
                <Link
                  key={th.id}
                  href={`/forum/${encodeURIComponent(th.id)}`}
                  className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition hover:shadow-md sm:gap-4 sm:p-4"
                >
                  <span
                    className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white sm:h-16 sm:w-16"
                    style={{ backgroundColor: th.categoryColor || "#0056D2" }}
                  >
                    <ForumCategoryIcon name={th.categoryIcon} className="h-7 w-7 sm:h-8 sm:w-8" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-bold text-[#1A1A1A] sm:text-lg">
                      {th.title}
                    </h2>
                    <p className="mt-1 truncate text-sm text-[#0056D2]">
                      {th.authorName ? `${th.authorName}: ` : ""}
                      {th.categoryName}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 text-xs text-[#888]">
                    <div className="flex items-center gap-2">
                      {th.isPinned ? (
                        <span className="text-[#0056D2]" title={t("forum.pinned", "Pinned")}>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M14 3v6.5l2 2V14h-3v7l-1 1-1-1v-7H8v-2.5l2-2V3h4Z" />
                          </svg>
                        </span>
                      ) : null}
                      {th.isLocked ? (
                        <span className="text-[#999]" title={t("forum.locked", "Locked")}>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        </span>
                      ) : null}
                      <span>{formatDate(th.lastReplyAt || th.createdAt)}</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <svg className="h-4 w-4 text-[#ccc]" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                      <span className="font-semibold text-[#0056D2]">{th.replyCount}</span>
                    </span>
                  </div>
                </Link>
              ))
            )}

            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#0056D2] text-[#0056D2] disabled:opacity-40"
                  aria-label={t("forum.prevPage", "Previous")}
                >
                  {/* Points toward previous: left in LTR, right in RTL (outward) */}
                  <svg className="h-4 w-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M15 6 9 12l6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {pageNumbers.map((n, i) => {
                  const prev = pageNumbers[i - 1];
                  const gap = prev != null && n - prev > 1;
                  return (
                    <span key={n} className="contents">
                      {gap ? <span className="px-1 text-[#999]">…</span> : null}
                      <button
                        type="button"
                        onClick={() => setPage(n)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold ${
                          n === currentPage
                            ? "bg-[#0056D2] text-white"
                            : "border border-[#0056D2] text-[#0056D2]"
                        }`}
                      >
                        {n}
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#0056D2] text-[#0056D2] disabled:opacity-40"
                  aria-label={t("forum.nextPage", "Next")}
                >
                  {/* Points toward next: right in LTR, left in RTL (outward) */}
                  <svg className="h-4 w-4 rotate-180 rtl:rotate-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M15 6 9 12l6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="text-base font-bold text-[#1A1A1A]">
                {t("forum.categories", "Sections")}
              </h2>
              <ul className="mt-3 space-y-2">
                {sidebarCategories.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryId(c.id);
                        setPage(1);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-start transition hover:bg-[#F8F9FB] ${
                        categoryId === c.id ? "bg-[#F0F5FF]" : ""
                      }`}
                    >
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: c.color || "#0056D2" }}
                      >
                        <ForumCategoryIcon name={c.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1A1A1A]">
                        {c.name}
                        {c.isLocked ? (
                          <span className="ms-1 text-[10px] text-[#999]">🔒</span>
                        ) : null}
                      </span>
                      <span className="rounded-md bg-[#F0F2F5] px-2 py-0.5 text-xs font-semibold text-[#666]">
                        {formatCount(c.threadCount)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {categories.length > 6 ? (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((v) => !v)}
                  className="mt-3 w-full rounded-lg border border-[#0056D2] py-2 text-sm font-semibold text-[#0056D2] hover:bg-[#F0F5FF]"
                >
                  {showAllCategories
                    ? t("forum.showLessCategories", "Show less")
                    : t("forum.viewAllCategories", "View all sections")}
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
