import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getStudentDashboardFlags, getStudentPurchases } from "@/lib/student-dashboard";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function StudentPurchasesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  const flags = await getStudentDashboardFlags();
  if (!flags.purchases) redirect("/dashboard");

  const [t, purchases] = await Promise.all([
    getServerTranslator(),
    getStudentPurchases(session.user.id),
  ]);
  const egp = t("common.egyptianPoundShort", "EGP");

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">{t("studentDash.nav.purchases", "Purchases")}</h2>

      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("studentDash.purchasedCourses", "Purchased courses")}</h3>
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--color-surface)] text-start">
                <th className="p-3 text-start">{t("studentDash.item", "Item")}</th>
                <th className="p-3 text-start">{t("studentDash.date", "Date")}</th>
                <th className="p-3 text-start">{t("studentDash.amount", "Amount")}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.courses.map((row) => (
                <tr key={row.id} className="border-b border-[var(--color-border)]/50">
                  <td className="p-3">
                    {row.slug ? (
                      <Link href={`/courses/${row.slug}`} className="underline">
                        {row.title}
                      </Link>
                    ) : (
                      row.title
                    )}
                  </td>
                  <td className="p-3 tabular-nums">{row.at.slice(0, 10)}</td>
                  <td className="p-3 tabular-nums">
                    {row.amount.toFixed(0)} {egp}
                  </td>
                </tr>
              ))}
              {purchases.courses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-[var(--color-muted)]">
                    {t("studentDash.noPurchases", "No purchases yet.")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("studentDash.purchasedFiles", "Purchased files & books")}</h3>
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--color-surface)] text-start">
                <th className="p-3 text-start">{t("studentDash.item", "Item")}</th>
                <th className="p-3 text-start">{t("studentDash.date", "Date")}</th>
                <th className="p-3 text-start">{t("studentDash.amount", "Amount")}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.products.map((row) => (
                <tr key={row.id} className="border-b border-[var(--color-border)]/50">
                  <td className="p-3">{row.title}</td>
                  <td className="p-3 tabular-nums">{String(row.at).slice(0, 10)}</td>
                  <td className="p-3 tabular-nums">
                    {Number(row.amount).toFixed(0)} {egp}
                  </td>
                </tr>
              ))}
              {purchases.products.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-[var(--color-muted)]">
                    {t("studentDash.noPurchases", "No purchases yet.")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
