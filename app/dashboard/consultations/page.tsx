import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listAllConsultations } from "@/lib/lms-features-db";
import { ConsultationsAdminClient } from "./ConsultationsAdminClient";
export default async function ConsultationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  return <ConsultationsAdminClient initialOffers={await listAllConsultations().catch(() => [])} />;
}
