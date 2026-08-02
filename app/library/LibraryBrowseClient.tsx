"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HorizontalScrollRow } from "@/components/HorizontalScrollRow";
import { LibraryProductCard } from "@/components/LibraryProductCard";
import { useT } from "@/components/LocaleProvider";
import type { LibraryCategory, StoreProduct } from "@/lib/types";
import { newAnalyticsEventId, trackMetaEvent } from "@/lib/analytics-events";

const HOME_PREVIEW = 8;

export type LibrarySubscriptionAccess = {
  active: boolean;
  allCategories: boolean;
  categoryIds: string[];
};

export function LibraryBrowseClient({
  products,
  categories,
  isSubscribed,
  librarySubscriptionAccess,
  isLoggedIn,
  purchasedProductIds,
}: {
  products: StoreProduct[];
  categories: LibraryCategory[];
  /** @deprecated استخدم librarySubscriptionAccess */
  isSubscribed?: boolean;
  librarySubscriptionAccess?: LibrarySubscriptionAccess;
  isLoggedIn: boolean;
  purchasedProductIds: string[];
}) {
  const libAccess: LibrarySubscriptionAccess = librarySubscriptionAccess ?? {
    active: !!isSubscribed,
    allCategories: !!isSubscribed,
    categoryIds: [],
  };
  function productCoveredBySub(p: StoreProduct): boolean {
    if (!libAccess.active) return false;
    if (libAccess.allCategories) return true;
    const cid = p.categoryId?.trim();
    if (!cid) return false;
    return libAccess.categoryIds.includes(cid);
  }
  const t = useT();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "article" | "file">("all");
  const [ownedIds, setOwnedIds] = useState<string[]>(purchasedProductIds);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (typeFilter === "article" && p.contentType !== "article") return false;
      if (typeFilter === "file" && p.contentType === "article") return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, query, typeFilter]);

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
    const product = products.find((p) => p.id === productId);
    trackMetaEvent("InitiateCheckout", {
      content_ids: [productId],
      content_type: "product",
      content_name: product?.title || "library_item",
      value: product ? Number(product.price) : undefined,
      currency: "EGP",
      num_items: 1,
    });
    const purchaseEventId = newAnalyticsEventId();
    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-meta-event-id": purchaseEventId,
        },
        body: JSON.stringify({
          productId,
          metaEventId: purchaseEventId,
          couponCode: couponCode.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("library.buyFailed", "Purchase failed"));
      setOwnedIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
      trackMetaEvent(
        "Purchase",
        {
          content_ids: [productId],
          content_type: "product",
          content_name: product?.title || "library_item",
          value: typeof data.pricePaid === "number" ? data.pricePaid : product ? Number(product.price) : undefined,
          currency: "EGP",
          num_items: 1,
          order_id: purchaseEventId,
        },
        { eventId: purchaseEventId },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("library.buyFailed", "Purchase failed"));
    } finally {
      setLoadingId(null);
    }
  }

  function categoryLabel(cat: LibraryCategory) {
    return cat.nameAr?.trim() || cat.name;
  }

  function renderRow(catId: string, label: string, moreHref: string | null) {
    const items = productsByCategory.get(catId);
    if (!items?.length) return null;
    const preview = items.slice(0, HOME_PREVIEW);
    return (
      <div key={catId} className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{label}</h3>
          {moreHref ? (
            <Link
              href={moreHref}
              className="shrink-0 text-sm font-semibold text-[var(--color-primary)] hover:underline"
            >
              {t("library.viewMore", "عرض المزيد")} ←
            </Link>
          ) : null}
        </div>
        <HorizontalScrollRow>
          {preview.map((p) => (
            <LibraryProductCard
              key={p.id}
              product={p}
              isSubscribed={productCoveredBySub(p)}
              isLoggedIn={isLoggedIn}
              ownedIds={ownedIds}
              loadingId={loadingId}
              onBuy={(id) => void buy(id)}
              layout="carousel"
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
          {t("library.pageIntro", "Browse categories below, or open View more for the full list.")}
        </p>
        {isLoggedIn && !libAccess.active ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={t("coupons.codePlaceholder", "Discount coupon code")}
              className="min-w-[12rem] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-mono"
            />
            <span className="text-xs text-[var(--color-muted)]">
              {t("coupons.libraryHint", "Optional coupon applied on the next purchase")}
            </span>
          </div>
        ) : null}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("library.searchPlaceholder", "Search by title…")}
            className="w-full flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
          />
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", t("library.filterAll", "All")],
                ["article", t("library.filterArticles", "Articles")],
                ["file", t("library.filterFiles", "Files & books")],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTypeFilter(key)}
                className={`rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium ${
                  typeFilter === key
                    ? "bg-[var(--color-primary)] text-white"
                    : "border border-[var(--color-border)] text-[var(--color-foreground)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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
              const parentHref = `/library/category/${encodeURIComponent(parent.slug)}`;
              return (
                <section key={parent.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
                      {categoryLabel(parent)}
                    </h2>
                    <Link
                      href={parentHref}
                      className="shrink-0 text-sm font-semibold text-[var(--color-primary)] hover:underline"
                    >
                      {t("library.viewMore", "عرض المزيد")} ←
                    </Link>
                  </div>
                  {renderRow(parent.id, t("library.generalInCategory", "General"), null)}
                  {children.map((child) =>
                    renderRow(
                      child.id,
                      categoryLabel(child),
                      `/library/category/${encodeURIComponent(child.slug)}`,
                    ),
                  )}
                </section>
              );
            })}
            {renderRow(
              "__uncategorized__",
              t("library.uncategorized", "Other"),
              "/library/category/uncategorized",
            )}
          </div>
        ) : (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                {t("library.allItems", "All items")}
              </h2>
              <Link
                href="/library/category/all"
                className="shrink-0 text-sm font-semibold text-[var(--color-primary)] hover:underline"
              >
                {t("library.viewMore", "عرض المزيد")} ←
              </Link>
            </div>
            <HorizontalScrollRow>
              {filtered.slice(0, HOME_PREVIEW).map((p) => (
                <LibraryProductCard
                  key={p.id}
                  product={p}
                  isSubscribed={productCoveredBySub(p)}
                  isLoggedIn={isLoggedIn}
                  ownedIds={ownedIds}
                  loadingId={loadingId}
                  onBuy={(id) => void buy(id)}
                  layout="carousel"
                />
              ))}
            </HorizontalScrollRow>
          </div>
        )}
      </div>
    </section>
  );
}
