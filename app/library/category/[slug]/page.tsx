import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getLibraryCategoryBySlug,
  listLibraryCategoriesAll,
  listStudentStorePurchases,
  listStoreProductsPublic,
  listStoreProductsPublicByCategoryIds,
  listStoreProductsPublicUncategorized,
} from "@/lib/db";
import { getActiveSubscriptionAccess } from "@/lib/subscription-access";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import type { StoreProduct } from "@/lib/types";
import { LibraryCategoryClient } from "./LibraryCategoryClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function toStoreProduct(p: Awaited<ReturnType<typeof listStoreProductsPublic>>[number]): StoreProduct {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    costPrice: p.costPrice,
    imageUrl: p.imageUrl,
    pdfUrl: p.pdfUrl,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt,
    categoryId: p.categoryId,
    contentType: p.contentType,
    articleBody: p.articleBody,
    viewCount: p.viewCount,
  };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const t = await getServerTranslator();
  const locale = await getLocaleFromCookie();
  if (slug === "uncategorized") {
    return { title: `${t("library.uncategorized", "Other")} | ${t("library.pageTitle", "Library")}` };
  }
  if (slug === "all") {
    return { title: `${t("library.allItems", "All items")} | ${t("library.pageTitle", "Library")}` };
  }
  const cat = await getLibraryCategoryBySlug(slug).catch(() => null);
  if (!cat) return { title: t("library.pageTitle", "Library") };
  const name = pickLocalizedText(locale, cat.nameAr, cat.name) || cat.name;
  return { title: `${name} | ${t("library.pageTitle", "Library")}` };
}

export default async function LibraryCategoryPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug || "").trim();
  if (!slug) notFound();

  const [t, locale, session] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getServerSession(authOptions),
  ]);

  let title = "";
  let products: StoreProduct[] = [];

  if (slug === "uncategorized") {
    title = t("library.uncategorized", "Other");
    const rows = await listStoreProductsPublicUncategorized().catch(() => []);
    products = rows.map(toStoreProduct);
  } else if (slug === "all") {
    title = t("library.allItems", "All items");
    const rows = await listStoreProductsPublic().catch(() => []);
    products = rows.map(toStoreProduct);
  } else {
    const category = await getLibraryCategoryBySlug(slug).catch(() => null);
    if (!category) notFound();
    title = pickLocalizedText(locale, category.nameAr, category.name) || category.name;
    const allCats = await listLibraryCategoriesAll().catch(() => []);
    const childIds = allCats.filter((c) => c.parentId === category.id).map((c) => c.id);
    const ids = [category.id, ...childIds];
    const rows = await listStoreProductsPublicByCategoryIds(ids).catch(() => []);
    products = rows.map(toStoreProduct);
  }

  let librarySubscriptionAccess = {
    active: false,
    allCategories: false,
    categoryIds: [] as string[],
  };
  let purchasedProductIds: string[] = [];
  if (session?.user?.role === "STUDENT" && session.user.id) {
    const access = await getActiveSubscriptionAccess(session.user.id).catch(() => null);
    if (access?.active && access.coversLibrary) {
      librarySubscriptionAccess = {
        active: true,
        allCategories: access.legacyAllLibrary,
        categoryIds: access.libraryCategoryIds,
      };
    }
    const purchases = await listStudentStorePurchases(session.user.id).catch(() => []);
    purchasedProductIds = purchases.map((p) => p.productId);
  }

  return (
    <LibraryCategoryClient
      title={title}
      products={products}
      librarySubscriptionAccess={librarySubscriptionAccess}
      isLoggedIn={!!session}
      purchasedProductIds={purchasedProductIds}
    />
  );
}
