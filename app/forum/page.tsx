import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listForumCategories, listForumThreads } from "@/lib/forum-db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { ForumBrowseClient } from "./ForumBrowseClient";

export const dynamic = "force-dynamic";

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryParam } = await searchParams;
  const [t, locale, session] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getServerSession(authOptions),
  ]);

  const categories = await listForumCategories(true).catch(() => []);
  const activeCategoryId =
    categoryParam && categories.some((c) => c.id === categoryParam) ? categoryParam : null;
  const threads = await listForumThreads(activeCategoryId, 80).catch(() => []);

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: locale === "en" ? c.name : c.nameAr?.trim() || c.name,
    description: c.description,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
            {t("forum.pageTitle", "Forum")}
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
            {t(
              "forum.pageSubtitle",
              "Ask questions, share updates, and discuss courses with the community.",
            )}
          </p>
        </div>
        {session ? (
          <Link
            href="/forum/new"
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
          >
            {t("forum.newThread", "New topic")}
          </Link>
        ) : (
          <Link
            href="/login?callbackUrl=/forum"
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/40"
          >
            {t("forum.loginToPost", "Log in to post")}
          </Link>
        )}
      </div>

      <ForumBrowseClient
        categories={categoryOptions}
        threads={threads.map((th) => ({
          id: th.id,
          title: th.title,
          authorName: th.authorName ?? "",
          categoryId: th.categoryId,
          categoryName: th.categoryName ?? "",
          replyCount: th.replyCount ?? 0,
          isPinned: th.isPinned,
          isLocked: th.isLocked,
          createdAt: new Date(th.createdAt).toISOString(),
          lastReplyAt: th.lastReplyAt ? new Date(th.lastReplyAt).toISOString() : null,
        }))}
        activeCategoryId={activeCategoryId}
        locale={locale}
      />
    </div>
  );
}
