import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getTeacherIdsExcludedFromPublicCourseLists } from "@/lib/db";
import { getPublishedCoursesCached } from "@/lib/cached-public-data";
import { TeacherCoursesSearch, type TeacherCourseListItem } from "@/app/courses/TeacherCoursesSearch";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const cat = await getCategoryBySlug(decodeURIComponent(slug)).catch(() => null);
  if (!cat) return { title: t("common.courses", "Courses") };
  const name = pickLocalizedText(locale, cat.name_ar, cat.name) || cat.name;
  return { title: `${name} | ${t("common.courses", "Courses")}` };
}

export default async function CourseCategoryPage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw || "").trim();
  if (!slug) notFound();

  const [t, locale, category] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getCategoryBySlug(slug).catch(() => null),
  ]);
  if (!category) notFound();

  const title = pickLocalizedText(locale, category.name_ar, category.name) || category.name;
  let courses: Awaited<ReturnType<typeof getPublishedCoursesCached>> = [];
  try {
    courses = await getPublishedCoursesCached();
  } catch {
    courses = [];
  }

  const hideTeacherCreators = await getTeacherIdsExcludedFromPublicCourseLists().catch(
    () => new Set<string>(),
  );
  let filtered = courses.filter(
    (c) => (c as { category?: { slug?: string } }).category?.slug === slug,
  );
  if (hideTeacherCreators.size > 0) {
    filtered = filtered.filter((c) => {
      const row = c as { createdById?: string | null; created_by_id?: string | null };
      const creator = row.createdById ?? row.created_by_id ?? null;
      return !creator || !hideTeacherCreators.has(creator);
    });
  }

  const items: TeacherCourseListItem[] = filtered.map((c) => {
    const row = c as TeacherCourseListItem & {
      category?: { id?: string; name?: string; nameAr?: string | null; name_ar?: string | null; slug?: string };
    };
    return {
      ...row,
      category: row.category
        ? {
            id: row.category.id ?? category.id,
            name: row.category.name ?? category.name,
            nameAr: row.category.nameAr ?? row.category.name_ar ?? category.name_ar,
            slug: row.category.slug ?? category.slug,
          }
        : {
            id: category.id,
            name: category.name,
            nameAr: category.name_ar,
            slug: category.slug,
          },
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link href="/courses" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        ← {t("common.backToCourses", "Back to courses")}
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-[var(--color-foreground)]">{title}</h1>
      <p className="mt-2 text-[var(--color-muted)]">
        {t("courses.categorySubtitle", "Courses in this category")}
      </p>
      <div className="mt-8">
        <TeacherCoursesSearch courses={items} groupByCategory={false} />
      </div>
    </div>
  );
}
