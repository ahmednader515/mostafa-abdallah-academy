"use client";

import Link from "next/link";
import { FormattedPrice } from "@/components/FormattedPrice";
import { useT } from "@/components/LocaleProvider";
import type { StoreProduct } from "@/lib/types";

export function LibraryProductCard({
  product,
  isSubscribed,
  isLoggedIn,
  ownedIds,
  loadingId,
  onBuy,
  layout = "carousel",
}: {
  product: StoreProduct;
  isSubscribed: boolean;
  isLoggedIn: boolean;
  ownedIds: string[];
  loadingId: string | null;
  onBuy: (id: string) => void;
  layout?: "carousel" | "grid";
}) {
  const t = useT();
  const isArticle = product.contentType === "article";
  const canAccess = isSubscribed || ownedIds.includes(product.id);
  const canDownload = !isArticle && canAccess && !!product.pdfUrl;
  const shell =
    layout === "grid"
      ? "flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
      : "w-64 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]";

  return (
    <article className={shell}>
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageUrl} alt={product.title} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 bg-[var(--color-primary)]/10" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-[var(--color-foreground)]">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-xs text-[var(--color-muted)]">{product.description}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          {isArticle ? (
            <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-500">
              {t("library.articleBadge", "Article")}
            </span>
          ) : isSubscribed ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-500">
              {t("library.freeWithSubscription", "Free with subscription")}
            </span>
          ) : ownedIds.includes(product.id) ? (
            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-400">
              {t("library.purchased", "Purchased")}
            </span>
          ) : (
            <span className="text-xs font-semibold text-[var(--color-primary)]">
              <FormattedPrice amountEgp={Number(product.price)} />
            </span>
          )}
          {isArticle ? (
            <Link
              href={`/library/${product.id}`}
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)]"
            >
              {t("library.readArticle", "Read")}
            </Link>
          ) : canDownload ? (
            <a
              href={product.pdfUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)]"
            >
              {t("library.downloadPdf", "Download PDF")}
            </a>
          ) : canAccess ? (
            <span className="text-xs text-[var(--color-muted)]">{t("library.fileUnavailable", "File unavailable")}</span>
          ) : isLoggedIn ? (
            <button
              type="button"
              onClick={() => onBuy(product.id)}
              disabled={loadingId === product.id}
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {loadingId === product.id ? t("library.buying", "Buying…") : t("library.buy", "Buy")}
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              {t("library.loginToBuy", "Login to buy")}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
