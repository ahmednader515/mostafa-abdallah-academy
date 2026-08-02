import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getJobsHeroImageUrl, listAllJobs, listJobCategories } from "@/lib/db";
import { requireStaffPermission } from "@/lib/require-permission";
import type { JobCategory, JobPosting } from "@/lib/types";
import { JobsAdminClient } from "./JobsAdminClient";

export default async function JobsDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const gate = await requireStaffPermission(session.user.id, session.user.role, "canPostJobs");
  if (!gate.ok) redirect("/dashboard");

  const [jobsRaw, catsRaw, heroImageUrl] = await Promise.all([
    listAllJobs().catch(() => []),
    listJobCategories().catch(() => []),
    getJobsHeroImageUrl().catch(() => "/images/jobs-hero.png"),
  ]);

  const initialJobs = jobsRaw as unknown as JobPosting[];
  const initialCategories = catsRaw as unknown as JobCategory[];

  return (
    <JobsAdminClient
      initialJobs={initialJobs}
      initialCategories={initialCategories}
      initialHeroImageUrl={heroImageUrl}
    />
  );
}
