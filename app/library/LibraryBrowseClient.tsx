"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FormattedPrice } from "@/components/FormattedPrice";
import { HorizontalScrollRow } from "@/components/HorizontalScrollRow";
import { useT } from "@/components/LocaleProvider";
import type { LibraryCategory, StoreProduct } from "@/lib/types";

function ProductCard({
  product,
  isSubscribed,
  isLoggedIn,
  ownedIds,
  loadingId,
  onBuy,
}: {
  product: StoreProduct;
  isSubscribed: boolean;
  isLoggedIn: boolean;
  ownedIds: string[];
  loadingId: string | null;
  onBuy: (id: string) => void;
}) {
  const t = useT();
  const isArticle = product.contentType === "article";
  const canAccess = isSubscribed || ownedIds.includes(product.id);
  const canDownload = !isArticle && canAccess && !!product.pdfUrl;

  return (
    <article className="w-64 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.title} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 bg-[var(--color-primary)]/10" />
      )}
      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-[var(--color-foreground)]">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-xs text-[var(--color-muted)]">{product.description}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
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

export function LibraryBrowseClient({
  products,
  categories,
  isSubscribed,
  isLoggedIn,
  purchasedProductIds,
}: {
  products: StoreProduct[];
  categories: LibraryCategory[];
  isSubscribed: boolean;
  isLoggedIn: boolean;
  purchasedProductIds: string[];
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [ownedIds, setOwnedIds] = useState<string[]>(purchasedProductIds);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, query]);

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order),
    [categories],
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string, LibraryCategory[]>();
    for (const c of categories) {
      if (!c.parentId) continue;
      const list = map.get(c.parentId) ?? [];
      list.push(c);
      map.set(c.parentId, list);
    }
    for (const [, list] of map) list.sort((a, b) => a.order - b.order);
    return map;
  }, [categories]);

  const productsByCategory = useMemo(() => {
    const map = new Map<string, StoreProduct[]>();
    for (const p of filtered) {
      const key = p.categoryId ?? "__uncategorized__";
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return map;
  }, [filtered]);

  async function buy(productId: string) {
    setError("");
    setLoadingId(productId);
    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("library.buyFailed", "Purchase failed"));
      setOwnedIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("library.buyFailed", "Purchase failed"));
    } finally {
      setLoadingId(null);
    }
  }

  function categoryLabel(cat: LibraryCategory) {
    return cat.nameAr?.trim() || cat.name;
  }

  function renderRow(catId: string, label: string) {
    const items = productsByCategory.get(catId);
    if (!items?.length) return null;
    return (
      <div key={catId} className="mt-6">
        <h3 className="mb-3 text-lg font-semibold text-[var(--color-foreground)]">{label}</h3>
        <HorizontalScrollRow>
          {items.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isSubscribed={isSubscribed}
              isLoggedIn={isLoggedIn}
              ownedIds={ownedIds}
              loadingId={loadingId}
              onBuy={(id) => void buy(id)}
            />
          ))}
        </HorizontalScrollRow>
      </div>
    );
  }

  const hasGrouped =
    parentCategories.some((p) => {
      const children = childrenByParent.get(p.id) ?? [];
      return (
        (productsByCategory.get(p.id)?.length ?? 0) > 0 ||
        children.some((c) => (productsByCategory.get(c.id)?.length ?? 0) > 0)
      );
    }) || (productsByCategory.get("__uncategorized__")?.length ?? 0) > 0;

  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">{t("library.pageTitle", "Library")}</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          {t("library.pageIntro", "Search for files, books, or articles and choose what suits you.")}
        </p>
        <div className="mt-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("library.searchPlaceholder", "Search by title…")}
            className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
          />
        </div>
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

        {filtered.length === 0 ? (
          <p className="mt-8 text-sm text-[var(--color-muted)]">{t("library.noResults", "No results found.")}</p>
        ) : hasGrouped ? (
          <div className="mt-8 space-y-8">
            {parentCategories.map((parent) => {
              const children = childrenByParent.get(parent.id) ?? [];
              const parentHas =
                (productsByCategory.get(parent.id)?.length ?? 0) > 0 ||
                children.some((c) => (productsByCategory.get(c.id)?.length ?? 0) > 0);
              if (!parentHas) return null;
              return (
                <section key={parent.id}>
                  <h2 className="text-2xl font-bold text-[var(--color-foreground)]">{categoryLabel(parent)}</h2>
                  {renderRow(parent.id, t("library.generalInCategory", "General"))}
                  {children.map((child) => renderRow(child.id, categoryLabel(child)))}
                </section>
              );
            })}
            {renderRow("__uncategorized__", t("library.uncategorized", "Other"))}
          </div>
        ) : (
          <div className="mt-8">
            <HorizontalScrollRow>
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isSubscribed={isSubscribed}
                  isLoggedIn={isLoggedIn}
                  ownedIds={ownedIds}
                  loadingId={loadingId}
                  onBuy={(id) => void buy(id)}
                />
              ))}
            </HorizontalScrollRow>
          </div>
        )}
      </div>
    </section>
  );
}
