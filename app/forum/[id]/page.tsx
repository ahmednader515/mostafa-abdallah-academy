import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getForumThreadById, listForumReplies } from "@/lib/forum-db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { ThreadActions } from "./ThreadActions";
import { ReplyForm } from "./ReplyForm";

export const dynamic = "force-dynamic";

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, locale, session] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getServerSession(authOptions),
  ]);

  const thread = await getForumThreadById(id).catch(() => null);
  if (!thread) notFound();
  const replies = await listForumReplies(id).catch(() => []);

  const dateLocale = locale === "en" ? "en-US" : "ar-EG";
  const formatDate = (d: Date) =>
    new Date(d).toLocaleString(dateLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "ASSISTANT_ADMIN";
  const canModerate = !!isStaff || thread.authorId === session?.user?.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/forum" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        {t("forum.backToForum", "← Back to forum")}
      </Link>

      <article className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
          {thread.isPinned ? (
            <span className="rounded-full bg-[#F59E0B]/15 px-2 py-0.5 font-semibold text-[#F59E0B]">
              {t("forum.pinned", "Pinned")}
            </span>
          ) : null}
          {thread.isLocked ? (
            <span className="rounded-full bg-[var(--color-muted)]/15 px-2 py-0.5 font-semibold">
              {t("forum.locked", "Locked")}
            </span>
          ) : null}
          <span>{thread.categoryName}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-foreground)]">{thread.title}</h1>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          {thread.authorName} · {formatDate(thread.createdAt)}
        </p>
        <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]">
          {thread.body}
        </div>
        {canModerate ? (
          <ThreadActions
            threadId={thread.id}
            isPinned={thread.isPinned}
            isLocked={thread.isLocked}
            isStaff={!!isStaff}
          />
        ) : null}
      </article>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-[var(--color-foreground)]">
          {t("forum.replies", "Replies")} ({replies.length})
        </h2>
        {replies.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            {t("forum.noReplies", "No replies yet.")}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {replies.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <p className="text-xs text-[var(--color-muted)]">
                  {r.authorName} · {formatDate(r.createdAt)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-foreground)]">{r.body}</p>
              </li>
            ))}
          </ul>
        )}

        {session && !thread.isLocked ? (
          <ReplyForm threadId={thread.id} />
        ) : thread.isLocked ? (
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            {t("forum.threadLocked", "This topic is locked. New replies are disabled.")}
          </p>
        ) : (
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            <Link href={`/login?callbackUrl=/forum/${encodeURIComponent(thread.id)}`} className="text-[var(--color-primary)] hover:underline">
              {t("forum.loginToReply", "Log in to reply")}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
