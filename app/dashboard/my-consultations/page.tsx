import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listPublishedConsultations } from "@/lib/lms-features-db";
import { getStudentDashboardFlags } from "@/lib/student-dashboard";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export default async function StudentConsultationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");
  const flags = await getStudentDashboardFlags();
  if (!flags.consultations) redirect("/dashboard");

  const [t, locale, offers] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    listPublishedConsultations().catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("studentDash.nav.consultations", "Consultations")}</h2>
        <Link href="/consultations" className="text-sm underline">
          {t("studentDash.browseConsultations", "Browse consultations")}
        </Link>
      </div>
      <p className="text-sm text-[var(--color-muted)]">
        {t(
          "studentDash.consultHint",
          "Book via the offer page. Messaging with staff is available in your inbox.",
        )}
      </p>
      <ul className="space-y-3">
        {offers.map((o) => {
          const title = pickLocalizedText(locale, o.titleAr, o.title);
          return (
            <li key={o.id} className="rounded-2xl border border-[var(--color-border)] p-4">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {t("studentDash.bookingStatus", "Booking")}:{" "}
                {o.bookingMode === "message"
                  ? t("studentDash.viaMessages", "Via messages")
                  : o.bookingMode}
              </p>
              <div className="mt-3 flex gap-3 text-sm">
                <Link href={`/consultations/${o.id}`} className="underline">
                  {t("studentDash.viewOffer", "View offer")}
                </Link>
                <Link href="/dashboard/messages" className="underline">
                  {t("studentDash.messages", "Messages")}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      {offers.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          {t("studentDash.noConsultations", "No consultation offers.")}
        </p>
      ) : null}
    </div>
  );
}
