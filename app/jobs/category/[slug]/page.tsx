import { notFound } from "next/navigation";
import {
  getJobCategoryBySlug,
  listPublishedJobs,
  listPublishedJobsByCategoryId,
} from "@/lib/db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import type { JobPosting } from "@/lib/types";
import { JobsCategoryClient } from "./JobsCategoryClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function toJob(j: Awaited<ReturnType<typeof listPublishedJobs>>[number]): JobPosting {
  return {
    id: j.id,
    title: j.title,
    titleAr: j.titleAr,
    description: j.description,
    descriptionAr: j.descriptionAr,
    location: j.location,
    jobType: j.jobType,
    imageUrl: j.imageUrl,
    email: j.email,
    phone: j.phone,
    phones: j.phones,
    whatsapp: j.whatsapp,
    locationEn: j.locationEn,
    jobTypeAr: j.jobTypeAr,
    jobTypeEn: j.jobTypeEn,
    categoryId: j.categoryId,
    companyName: j.companyName,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    salaryLabel: j.salaryLabel,
    experienceLabel: j.experienceLabel,
    skills: j.skills,
    badge: j.badge,
    showPhone: j.showPhone,
    showEmail: j.showEmail,
    contactOrder: j.contactOrder,
    viewCount: j.viewCount,
    isPublished: j.isPublished,
    order: j.order,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

export default async function JobsCategoryPage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw || "").trim();
  if (!slug) notFound();

  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);

  let title = "";
  let jobs: JobPosting[] = [];

  if (slug === "uncategorized") {
    title = t("jobs.uncategorized", "Other opportunities");
    const all = await listPublishedJobs().catch(() => []);
    jobs = all.filter((j) => !j.categoryId).map(toJob);
  } else {
    const cat = await getJobCategoryBySlug(slug).catch(() => null);
    if (!cat) notFound();
    title = pickLocalizedText(locale, cat.nameAr, cat.name) || cat.name;
    const rows = await listPublishedJobsByCategoryId(cat.id).catch(() => []);
    jobs = rows.map(toJob);
  }

  return <JobsCategoryClient title={title} jobs={jobs} />;
}
