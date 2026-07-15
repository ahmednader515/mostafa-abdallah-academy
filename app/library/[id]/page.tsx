import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getStoreProductById } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function LibraryArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getServerTranslator();
  const product = await getStoreProductById(id).catch(() => null);

  if (!product || !product.isActive || product.contentType !== "article") {
    notFound();
  }

  await getServerSession(authOptions);

  return (
    <article className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/library"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {t("library.backToLibrary", "← Back to library")}
        </Link>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="mt-6 h-56 w-full rounded-[var(--radius-card)] object-cover"
          />
        ) : null}
        <h1 className="mt-6 text-3xl font-bold text-[var(--color-foreground)]">{product.title}</h1>
        {product.description ? (
          <p className="mt-3 text-[var(--color-muted)]">{product.description}</p>
        ) : null}
        <div className="prose prose-sm mt-8 max-w-none whitespace-pre-wrap text-[var(--color-foreground)] dark:prose-invert">
          {product.articleBody ?? ""}
        </div>
      </div>
    </article>
  );
}
