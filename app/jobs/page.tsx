import { getJobsHeroImageUrl, listJobCategories, listPublishedJobs } from "@/lib/db";
import type { JobCategory, JobPosting } from "@/lib/types";
import { JobsBrowseClient } from "./JobsBrowseClient";

export const dynamic = "force-dynamic";

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

export default async function JobsPage() {
  const [jobsRaw, catsRaw, heroImageUrl] = await Promise.all([
    listPublishedJobs().catch(() => []),
    listJobCategories().catch(() => []),
    getJobsHeroImageUrl().catch(() => "/images/jobs-hero.png"),
  ]);
  const jobs = jobsRaw.map(toJob);
  const categories: JobCategory[] = catsRaw.map((c) => ({
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    slug: c.slug,
    order: c.order,
    createdAt: c.createdAt,
  }));

  return (
    <JobsBrowseClient jobs={jobs} categories={categories} heroImageUrl={heroImageUrl} />
  );
}
