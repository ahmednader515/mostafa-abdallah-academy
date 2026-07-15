import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listAllJobs } from "@/lib/db";
import { JobsAdminClient } from "./JobsAdminClient";

export default async function JobsDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const jobs = await listAllJobs().catch(() => []);

  return <JobsAdminClient initialJobs={jobs} />;
}
