import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listForumCategoriesForUser,
  listForumThreads,
} from "@/lib/forum-db";
import { getLocaleFromCookie } from "@/lib/i18n/server";
import { ForumBrowseClient } from "./ForumBrowseClient";

export const dynamic = "force-dynamic";

export default async function ForumPage() {
  const [locale, session] = await Promise.all([
    getLocaleFromCookie(),
    getServerSession(authOptions),
  ]);

  const role = session?.user?.role;
  const isLoggedIn = Boolean(session?.user?.id);
  const categories = await listForumCategoriesForUser(role, isLoggedIn, {
    withThreadCount: true,
  }).catch(() => []);

  const allowedIds = categories.map((c) => c.id);
  const threads = await listForumThreads(null, 200, {
    allowedCategoryIds: allowedIds,
  }).catch(() => []);

  return (
    <ForumBrowseClient
      isLoggedIn={isLoggedIn}
      categories={categories.map((c) => ({
        id: c.id,
        name: locale === "en" ? c.name : c.nameAr?.trim() || c.name,
        description:
          locale === "en"
            ? c.description
            : c.descriptionAr?.trim() || c.description,
        icon: c.icon,
        color: c.color,
        isPinned: c.isPinned,
        isLocked: c.isLocked,
        threadCount: c.threadCount ?? 0,
      }))}
      threads={threads.map((th) => ({
        id: th.id,
        title: th.title,
        body: th.body,
        authorName: th.authorName ?? "",
        categoryId: th.categoryId,
        categoryName:
          locale === "en"
            ? categories.find((c) => c.id === th.categoryId)?.name || th.categoryName || ""
            : categories.find((c) => c.id === th.categoryId)?.nameAr?.trim() ||
              th.categoryName ||
              "",
        categoryIcon: th.categoryIcon || "chat",
        categoryColor: th.categoryColor || "#0056D2",
        replyCount: th.replyCount ?? 0,
        isPinned: th.isPinned,
        isLocked: th.isLocked,
        createdAt: new Date(th.createdAt).toISOString(),
        lastReplyAt: th.lastReplyAt ? new Date(th.lastReplyAt).toISOString() : null,
      }))}
    />
  );
}
