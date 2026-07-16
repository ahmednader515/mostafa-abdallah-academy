import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { listForumCategories } from "@/lib/forum-db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { NewThreadForm } from "./NewThreadForm";

export default async function NewForumThreadPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/forum/new");

  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const categories = await listForumCategories(true).catch(() => []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/forum" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        {t("forum.backToForum", "← Back to forum")}
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[var(--color-foreground)]">
        {t("forum.newThread", "New topic")}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {t("forum.newThreadHint", "Choose a category and write a clear title so others can help.")}
      </p>
      <NewThreadForm
        categories={categories.map((c) => ({
          id: c.id,
          name: locale === "en" ? c.name : c.nameAr?.trim() || c.name,
        }))}
      />
    </div>
  );
}
