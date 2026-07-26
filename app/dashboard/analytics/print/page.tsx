import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireStaffPermission } from "@/lib/require-permission";
import { AnalyticsPrintClient } from "./AnalyticsPrintClient";

export default async function AnalyticsPrintPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const gate = await requireStaffPermission(
    session.user.id,
    session.user.role,
    "canViewAnalytics",
  );
  if (!gate.ok) redirect("/dashboard");

  return (
    <Suspense fallback={<p className="p-8">…</p>}>
      <AnalyticsPrintClient />
    </Suspense>
  );
}
