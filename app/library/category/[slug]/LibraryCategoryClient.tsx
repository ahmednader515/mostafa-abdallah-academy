"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LibraryProductCard } from "@/components/LibraryProductCard";
import { useLocale, useT } from "@/components/LocaleProvider";
import type { StoreProduct } from "@/lib/types";
import { newAnalyticsEventId, trackMetaEvent } from "@/lib/analytics-events";
import type { LibrarySubscriptionAccess } from "@/app/library/LibraryBrowseClient";

type SortKey = "default" | "newest" | "popular" | "alpha" | "price_asc" | "price_desc";

const PAGE_SIZE = 12;

export function LibraryCategoryClient({
  title,
  products,
  isSubscribed,
  librarySubscriptionAccess,
  isLoggedIn,
  purchasedProductIds,
}: {
  title: string;
  products: StoreProduct[];
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
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "article" | "file">("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [ownedIds, setOwnedIds] = useState<string[]>(purchasedProductIds);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (typeFilter === "article" && p.contentType !== "article") return false;
      if (typeFilter === "file" && p.contentType === "article") return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    });

    list = [...list];
    switch (sort) {
      case "newest":
        list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        break;
      case "popular":
        list.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0) || a.sortOrder - b.sortOrder);
        break;
      case "alpha":
        list.sort((a, b) => a.title.localeCompare(b.title, locale === "ar" ? "ar" : "en"));
        break;
      case "price_asc":
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price_desc":
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      default:
        list.sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || String(b.createdAt).localeCompare(String(a.createdAt)),
        );
    }
    return list;
  }, [products, query, typeFilter, sort, locale]);

  const visible = filteredSorted.slice(0, visibleCount);
  const canLoadMore = visible.length < filteredSorted.length;

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

  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/library"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {t("library.backToLibrary", "← Back to library")}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-[var(--color-foreground)]">{title}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t("library.categoryPageIntro", "All items in this category — search, filter, and sort.")}
          {" · "}
          {filteredSorted.length} {t("library.itemsCount", "items")}
        </p>

        {isLoggedIn && !libAccess.active ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={t("coupons.codePlaceholder", "Discount coupon code")}
              className="min-w-[12rem] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-mono"
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder={t("library.searchInCategory", "Search in this category…")}
            className="w-full flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
          />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setVisibleCount(PAGE_SIZE);
            }}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-sm"
            aria-label={t("library.sortLabel", "Sort")}
          >
            <option value="default">{t("library.sortDefault", "Default order")}</option>
            <option value="newest">{t("library.sortNewest", "Newest")}</option>
            <option value="popular">{t("library.sortPopular", "Most viewed")}</option>
            <option value="alpha">{t("library.sortAlpha", "Alphabetical")}</option>
            <option value="price_asc">{t("library.sortPriceAsc", "Price: low to high")}</option>
            <option value="price_desc">{t("library.sortPriceDesc", "Price: high to low")}</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
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
              onClick={() => {
                setTypeFilter(key);
                setVisibleCount(PAGE_SIZE);
              }}
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

        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

        {filteredSorted.length === 0 ? (
          <p className="mt-10 text-sm text-[var(--color-muted)]">{t("library.noResults", "No results found.")}</p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => (
                <LibraryProductCard
                  key={p.id}
                  product={p}
                  isSubscribed={productCoveredBySub(p)}
                  isLoggedIn={isLoggedIn}
                  ownedIds={ownedIds}
                  loadingId={loadingId}
                  onBuy={(id) => void buy(id)}
                  layout="grid"
                />
              ))}
            </div>
            {canLoadMore ? (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="rounded-[var(--radius-btn)] border border-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
                >
                  {t("library.loadMore", "Load more")}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
