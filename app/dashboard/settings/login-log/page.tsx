import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n/server";
import { LoginLogClient } from "./LoginLogClient";

export default async function LoginLogPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();
  return (
    <div>
      <Link href="/dashboard" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        {t("dashboard.backToDashboard", "Back to dashboard")}
      </Link>
      <h2 className="mt-4 text-xl font-bold">{t("dashboard.loginLog.title", "Login Log")}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.loginLog.description",
          "Full record of sign-ins and sign-outs, including session duration, IP, and device.",
        )}
      </p>
      <div className="mt-6">
        <LoginLogClient />
      </div>
    </div>
  );
}
