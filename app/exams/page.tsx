import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function ExamsPage() {
  const t = await getServerTranslator();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white">
        {t("nav.exams", "Exams")}
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        {t("stubs.comingSoon", "قريباً — هذه الصفحة قيد التطوير")}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
      >
        {t("common.home", "Home")}
      </Link>
    </div>
  );
}
