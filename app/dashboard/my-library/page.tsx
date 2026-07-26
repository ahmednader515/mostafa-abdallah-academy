import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getStudentDashboardFlags, getStudentPurchases } from "@/lib/student-dashboard";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function StudentLibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  const flags = await getStudentDashboardFlags();
  if (!flags.library) redirect("/dashboard");

  const [t, purchases] = await Promise.all([
    getServerTranslator(),
    getStudentPurchases(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("studentDash.nav.library", "My library")}</h2>
        <Link href="/library" className="text-sm underline">
          {t("studentDash.browseLibrary", "Browse full library")}
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {purchases.products.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{String(item.at).slice(0, 10)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.pdfUrl ? (
                <a
                  href={item.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {t("studentDash.openFile", "Open / download")}
                </a>
              ) : (
                <Link href="/library" className="text-xs underline">
                  {t("studentDash.readInLibrary", "Open in library")}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
      {purchases.products.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          {t("studentDash.emptyLibrary", "No owned library items yet.")}
        </p>
      ) : null}
    </div>
  );
}
